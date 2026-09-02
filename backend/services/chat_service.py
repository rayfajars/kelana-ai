from datetime import datetime, timezone

# pyrefly: ignore [missing-import]
from fastapi import HTTPException

from database import SessionLocal
from models.conversation import Conversation, Message
from services.bedrock_service import get_chat_response

DEFAULT_TITLE = "New conversation"
TITLE_MAX_LENGTH = 60


def _serialize_conversation(conversation: Conversation) -> dict:
    return {
        "id": conversation.id,
        "title": conversation.title,
        "created_at": conversation.created_at.isoformat(),
        "ended_at": conversation.ended_at.isoformat() if conversation.ended_at else None,
    }


def _serialize_message(message: Message) -> dict:
    return {
        "id": message.id,
        "role": message.role,
        "content": message.content,
        "created_at": message.created_at.isoformat(),
    }


def _load_owned_conversation(db, conversation_id: int, user_id: int) -> Conversation:
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == user_id)
        .first()
    )
    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail=f"Conversation with id {conversation_id} not found",
        )
    return conversation


def _shorten_for_title(text: str) -> str:
    single_line = " ".join(text.split())
    if len(single_line) <= TITLE_MAX_LENGTH:
        return single_line
    return single_line[: TITLE_MAX_LENGTH - 3].rstrip() + "..."


def build_prompt(history: list[Message], new_message: str) -> list[dict]:
    """
    Prompt builder — rebuild the whole thread so the model sees the context,
    not just the latest message.
    """
    messages = [
        {"role": message.role, "content": [{"text": message.content}]}
        for message in history
    ]
    messages.append({"role": "user", "content": [{"text": new_message}]})
    return messages


def create_conversation(user_id: int) -> int:
    db = SessionLocal()
    try:
        conversation = Conversation(user_id=user_id, title=DEFAULT_TITLE)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        return conversation.id
    finally:
        db.close()


def list_conversations(user_id: int) -> list[dict]:
    db = SessionLocal()
    try:
        conversations = (
            db.query(Conversation)
            .filter(Conversation.user_id == user_id)
            .order_by(Conversation.id.desc())
            .all()
        )
        return [_serialize_conversation(item) for item in conversations]
    finally:
        db.close()


def rename_conversation(conversation_id: int, user_id: int, title: str) -> dict:
    db = SessionLocal()
    try:
        conversation = _load_owned_conversation(db, conversation_id, user_id)
        conversation.title = title.strip()
        db.commit()
        db.refresh(conversation)
        return _serialize_conversation(conversation)
    finally:
        db.close()


def end_conversation(conversation_id: int, user_id: int) -> dict:
    db = SessionLocal()
    try:
        conversation = _load_owned_conversation(db, conversation_id, user_id)
        if conversation.ended_at is None:
            conversation.ended_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(conversation)
        return _serialize_conversation(conversation)
    finally:
        db.close()


def delete_conversation(conversation_id: int, user_id: int) -> dict:
    db = SessionLocal()
    try:
        conversation = _load_owned_conversation(db, conversation_id, user_id)
        db.delete(conversation)
        db.commit()
        return {"message": f"Conversation {conversation_id} deleted"}
    finally:
        db.close()


def list_messages(conversation_id: int, user_id: int) -> list[dict]:
    db = SessionLocal()
    try:
        conversation = _load_owned_conversation(db, conversation_id, user_id)
        messages = (
            db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.id)
            .all()
        )
        return [_serialize_message(item) for item in messages]
    finally:
        db.close()


def send_message(conversation_id: int, user_id: int, content: str) -> dict:
    """
    Orchestrates one chat turn: save the message, reload history, build the
    prompt, call Bedrock, then save and return the AI response.
    """
    db = SessionLocal()
    try:
        conversation = _load_owned_conversation(db, conversation_id, user_id)
        if conversation.ended_at is not None:
            raise HTTPException(
                status_code=409,
                detail="This conversation has ended. Start a new one to keep chatting.",
            )

        history = (
            db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.id)
            .all()
        )

        prompt = build_prompt(history, content)
        answer = get_chat_response(prompt)

        user_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=content,
        )
        assistant_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=answer,
        )
        db.add_all([user_message, assistant_message])

        # First user message doubles as the conversation title until renamed
        if not history and conversation.title == DEFAULT_TITLE:
            conversation.title = _shorten_for_title(content)

        db.commit()
        db.refresh(user_message)
        db.refresh(assistant_message)

        return {
            "conversation_id": conversation.id,
            "user_message": _serialize_message(user_message),
            "assistant_message": _serialize_message(assistant_message),
        }
    finally:
        db.close()
