# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field


class ConversationCreated(BaseModel):
    conversation_id: int


class ConversationPublic(BaseModel):
    id: int
    title: str
    created_at: str
    ended_at: str | None = None


class RenameConversationRequest(BaseModel):
    title: str = Field(min_length=1, max_length=256)


class MessagePublic(BaseModel):
    id: int
    role: str
    content: str
    created_at: str


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1)


class SendMessageResponse(BaseModel):
    conversation_id: int
    user_message: MessagePublic
    assistant_message: MessagePublic
