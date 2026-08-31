# pyrefly: ignore [missing-import]
import os
# pyrefly: ignore [missing-import]
import boto3
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
from services.bedrock_service import MODEL_ID, configure_bedrock_api_key

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-2")
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID")
NOT_FOUND_ANSWER = "I could not find this in the uploaded documents."


def get_bedrock_agent_runtime_client():
    """Build and return a boto3 Bedrock Agent Runtime client."""
    return boto3.client(
        service_name="bedrock-agent-runtime",
        region_name=AWS_REGION,
    )


def retrieve_and_generate(query: str) -> dict:
    """Retrieve from the managed KB, then generate a grounded answer."""
    if not KNOWLEDGE_BASE_ID:
        raise ValueError("KNOWLEDGE_BASE_ID is not set. Check your .env file.")

    client = get_bedrock_agent_runtime_client()
    response = client.retrieve(
        knowledgeBaseId=KNOWLEDGE_BASE_ID,
        retrievalQuery={"text": query},
        retrievalConfiguration={
            "managedSearchConfiguration": {
                "numberOfResults": 5,
            },
        },
    )

    snippets = []
    source = []
    seen_docs = set()
    for result in response.get("retrievalResults") or []:
        text = (result.get("content") or {}).get("text", "").strip()
        if not text:
            continue
        snippets.append(text)

        document_id = result.get("documentId")
        if document_id in seen_docs:
            continue
        seen_docs.add(document_id)
        source.append(
            {
                "document_id": document_id,
                "location": result.get("location"),
                "metadata": result.get("metadata"),
                "score": result.get("score"),
            }
        )

    if not snippets:
        return {"answer": NOT_FOUND_ANSWER, "source": []}

    context = "\n\n".join(snippets)
    prompt = (
        "Answer the question using only the documents below. "
        "If they do not contain the answer, say you could not find it "
        "in the uploaded documents. Do not use outside knowledge.\n\n"
        f"Documents:\n{context}\n\n"
        f"Question: {query}"
    )

    runtime = configure_bedrock_api_key()
    generated = runtime.converse(
        modelId=MODEL_ID,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
    )
    answer = generated["output"]["message"]["content"][0]["text"]
    return {"answer": answer, "source": source}
