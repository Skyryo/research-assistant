from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
from dotenv import load_dotenv

# LLMライブラリのインポート (例: OpenAI)
import openai

# 環境変数の読み込み
env = load_dotenv(".env.local")

# FastAPIアプリケーションのインスタンス化
app = FastAPI(
    title="Company LLM API",
    description="企業情報に基づいてLLMで回答を生成するAPI",
    version="1.0.0",
)

# CORS許可設定のOrigin
origins = [
    "http://localhost:5173",
]

# CORSミドルウェアの追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# リクエストボディのモデル定義
class CompanyQuery(BaseModel):
    company_name: str
    query: str
    additional_context: Optional[Dict] = None


class LLMResponse(BaseModel):
    company_name: str
    query: str
    response: str
    confidence_score: float

def generate_llm_response(
    company_name: str, query: str, context: Optional[Dict] = None
) -> Dict:
    """
    LLMを使用して回答を生成する関数
    """
    try:
  
        # プロンプトの構築
        prompt = f"""
        {company_name}に関する質問にお答えします。
        質問: {query}
        
        追加コンテキスト: {context if context else 'なし'}
        """

        # OpenAIのAPI呼び出し例
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "あなたは企業やサービスのデスクトップリサーチを支援するアシスタントです。"},
                {"role": "user", "content": prompt},
            ],
        )
        print(response)
        return {
            "response": response.choices[0].message.content,
            "confidence_score": 0.95,  # 実際のモデルの確信度を使用することを推奨
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze", response_model=LLMResponse)
async def analyze_company(query: CompanyQuery):
    """
    会社に関する質問を受け取り、LLMを使用して回答を生成するエンドポイント
    """
    try:
        # LLMレスポンスの生成
        llm_result = generate_llm_response(
            query.company_name, query.query, query.additional_context
        )

        # レスポンスの構築
        return LLMResponse(
            company_name=query.company_name,
            query=query.query,
            response=llm_result["response"],
            confidence_score=llm_result["confidence_score"],
        )

    except KeyError:
        raise HTTPException(
            status_code=404, detail=f"Company '{query.company_name}' not found"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


# 起動確認用のルート
@app.get("/")
async def root():
    return {"message": "Company LLM API is running"}
