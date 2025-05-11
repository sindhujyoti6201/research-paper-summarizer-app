import os
import json
import boto3
import botocore.auth
import botocore.awsrequest
import urllib3

REGION = "us-east-1"
EMBED_MODEL_ID = "amazon.titan-embed-text-v2:0"
GEN_MODEL_ID = "mistral.mistral-7b-instruct-v0:2"
OPENSEARCH_HOST = "https://search-vector-search-ysdsxdpfgxvffpewxvmjc3odya.us-east-1.es.amazonaws.com"
INDEX_NAME = "research-papers"
MIN_SCORE = 0.75

bedrock = boto3.client("bedrock-runtime", region_name=REGION)
http = urllib3.PoolManager()

def get_embedding(text):
    response = bedrock.invoke_model(
        modelId=EMBED_MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps({"inputText": text})
    )
    return json.loads(response['body'].read())['embedding']

def sign_request(method, url, body, service="es"):
    credentials = boto3.Session().get_credentials().get_frozen_credentials()
    request = botocore.awsrequest.AWSRequest(
        method=method,
        url=url,
        data=body,
        headers={
            "Host": OPENSEARCH_HOST.replace("https://", ""),
            "Content-Type": "application/json"
        }
    )
    signer = botocore.auth.SigV4Auth(credentials, service, REGION)
    signer.add_auth(request)
    return request

def call_bedrock_llm(prompt):
    body = {
        "prompt": prompt,
        "max_tokens": 500,
        "temperature": 0.7,
        "top_p": 0.9
    }
    response = bedrock.invoke_model(
        modelId=GEN_MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(body)
    )
    result = json.loads(response['body'].read())
    return result['outputs'][0]['text'].strip()

def lambda_handler(event, context):
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": "OK"}

    try:
        body = json.loads(event.get("body", "{}"))
        query = body.get("query")
        if not query:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Missing 'query'"})}

        query_embedding = get_embedding(query)

        knn_query = {
            "size": 5,
            "query": {
                "knn": {
                    "embedding": {
                        "vector": query_embedding,
                        "k": 5
                    }
                }
            }
        }

        url = f"{OPENSEARCH_HOST}/{INDEX_NAME}/_search"
        signed = sign_request("POST", url, json.dumps(knn_query))
        response = http.request(
            "POST",
            url,
            body=json.dumps(knn_query).encode(),
            headers=dict(signed.headers)
        )

        search_response = json.loads(response.data.decode())
        hits = search_response.get("hits", {}).get("hits", [])
        top_summaries = [
            h["_source"]["summary"]
            for h in hits if h.get("_score", 0) >= MIN_SCORE
        ]


        context_text = "\n\n".join([f"{i+1}. {text}" for i, text in enumerate(top_summaries)])
        prompt = (
            f"You are a helpful assistant. Based on the following research paper summaries, "
            f"answer the user's question in bullet points such that wheneverit shows each bullet oint in a seaparte line\n\n"
            f"Start each point with a (slash)n' '-'.\n\n"
            f"Papers:\n{context_text}\n\n"
            f"Question: {query}\n\nAnswer:"
            
        )

        answer = call_bedrock_llm(prompt)

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "results": [{"summary": s} for s in top_summaries],
                "answer": answer
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
