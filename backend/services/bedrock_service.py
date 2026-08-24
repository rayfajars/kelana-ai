# pyrefly: ignore [missing-import]
import os
import boto3
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

AWS_BEARER_TOKEN_BEDROCK: str | None = os.getenv("AWS_BEARER_TOKEN_BEDROCK")
AWS_REGION: str = os.getenv("AWS_REGION", "ap-southeast-2")
MODEL_ID: str = os.getenv("MODEL_ID", "amazon.nova-lite-v1:0")

TRAVEL_PLANNER_PROMPT = (
    "You are an experienced travel planner.\n"
    "Plan a {days}-day itinerary for {destination}.\n"
    "Budget: USD {budget}\n"
    "Travel Style: {travel_style}.\n"
    "\n"
    "Provide a detailed, structured response in Markdown format with the following sections:\n"
    "## Daily Itinerary\n"
    "For each day (e.g. ### Day 1: Title), provide:\n"
    "- **Morning**: 2-3 activities.\n"
    "- **Afternoon**: Cultural sites and experiences.\n"
    "- **Evening**: Dinner spots and nightlife.\n"
    "\n"
    "## Local Food Recommendations\n"
    "List 3-4 must-try local dishes or food spots with brief descriptions.\n"
    "\n"
    "## Travel Tips\n"
    "List 3-4 practical travel tips (transport, etiquette, money saving).\n"
    "\n"
    "## Estimated Budget Breakdown\n"
    "Provide estimated costs for Accommodation, Food & Dining, Activities, and Transport, plus a brief summary."
)


def configure_bedrock_api_key(api_key: str = None, region_name: str = None):
    """
    Configures AWS Bedrock API key / Bearer token and initializes boto3 bedrock-runtime client.
    """
    token = api_key or AWS_BEARER_TOKEN_BEDROCK or os.getenv("AWS_BEARER_TOKEN")
    region = region_name or AWS_REGION

    if token:
        os.environ["AWS_BEARER_TOKEN"] = token
        os.environ["AWS_BEARER_TOKEN_BEDROCK"] = token

    return boto3.client(
        service_name="bedrock-runtime",
        region_name=region,
    )


# Global bedrock runtime client initialized from env
client = configure_bedrock_api_key()


def get_ai_recommendation(
    days: int,
    destination: str,
    budget: float | int,
    travel_style: str,
    model_id: str = None
) -> str:
    """
    Gets AI recommendation using AWS Bedrock with prompt template.
    """
    global client
    if client is None:
        client = configure_bedrock_api_key()

    target_model_id = model_id or MODEL_ID

    prompt = TRAVEL_PLANNER_PROMPT.format(
        days=days,
        destination=destination,
        budget=budget,
        travel_style=travel_style,
    )

    response = client.converse(
        modelId=target_model_id,
        messages=[
            {
                "role": "user",
                "content": [{"text": prompt}],
            }
        ],
    )

    return response["output"]["message"]["content"][0]["text"]


