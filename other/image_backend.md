# バックエンド仕様書 (画像解析機能)

## 1. 概要

馬券画像の解析処理を非同期で行い、結果をデータベースに保存する機能を提供します。
フロントエンドは画像のアップロードと解析リクエストのトリガーを行い、バックエンドは解析、GCSへのアーカイブ、結果の保存を担当します。

## 2. エンドポイント

### 2.1. 解析リクエスト (非同期)

* **URL**: `POST /api/analyze/queue`
* **概要**: `analysis_queue` テーブルに登録されたタスクの処理を開始します。
* **リクエストボディ**:
  ```json
  {
    "queueId": "UUID string"
  }
  ```
* **レスポンス**:
  ```json
  {
    "message": "Analysis started",
    "queueId": "UUID string"
  }
  ```
* **動作**:
  1. リクエストを受け付けると即座にレスポンスを返します (Fire-and-forget)。
  2. バックグラウンドで以下の処理を実行します。
     * Supabase Storage から画像をダウンロード。
     * Gemini 1.5 Pro / Flash を使用して画像を解析。
     * 解析結果を正規化。
     * 画像を Google Cloud Storage (GCS) の `archive/` フォルダに移動。
     * Supabase Storage から画像を削除。
     * `analysis_queue` テーブルを更新 (status, result_json)。

## 3. データベース (Supabase)

### 3.1. `analysis_queue` テーブル

フロントエンドとバックエンドの連携に使用します。

| カラム名          | 型    | 説明                                                                          |
| :---------------- | :---- | :---------------------------------------------------------------------------- |
| `id`            | UUID  | PK。`queueId` として使用。                                                  |
| `user_id`       | UUID  | ユーザーID。                                                                  |
| `image_path`    | TEXT  | Supabase Storage 内のパス (例:`uid/filename.jpg`)。                         |
| `status`        | TEXT  | `pending` -> `processing` -> `completed` / `error`                    |
| `result_json`   | JSONB | 解析結果 (後述のJSONスキーマ)。                                               |
| `error_message` | TEXT  | エラー時の詳細メッセージ。                                                    |
| `date_order`    | DATE  | (任意) ユーザー指定の日付。存在する場合、解析結果の日付をこれで上書きします。 |

## 4. 解析結果 JSONスキーマ (`result_json`)

`analysis_queue.result_json` に保存されるデータ構造です。

```json
{
  "race": {
    "date": "YYYY-MM-DD or null", // date_orderがある場合はその値
    "place": "開催場所コード (例: 06, 05) or null",
    "race_number": integer or null (1-12)
  },
  "tickets": [
    {
      "receipt_unique_id": "string or null", // 受付番号等
      "bet_type": "WIN|PLACE|BRACKET_QUINELLA|QUINELLA|QUINELLA_PLACE|EXACTA|TRIO|TRIFECTA",
      "buy_type": "NORMAL|BOX|FORMATION|NAGASHI",
      "content": {
        "type": "string (bet_typeと同一)",
        "method": "string (buy_typeと同一)",
        "multi": boolean, // マルチ投票の場合 true
        "selections": "string[][]", // 買い目 (必ず2桁ゼロ埋め文字列)
        "axis": "string[]", // 流しの軸馬
        "partners": "string[]", // 流しの相手馬
        "positions": "integer[]" // 着順指定 (1着固定なら [1])
      },
      "amount_per_point": "integer or null", // 1点あたりの金額
      "total_points": "integer or null", // 点数
      "total_cost": "integer or null", // 合計金額
      "confidence": float, // 0.0 - 1.0
      "warnings": ["string", ...] // 解析上の警告 (金額不整合など)
    }
  ],
  "confidence": float // 全体の信頼度
}
```

### 4.1. `content` フィールドの補足

* **馬番/枠番**: 必ず `"01"`, `"10"` のように2桁のゼロ埋め文字列で格納されます。
* **NORMAL / BOX**: `selections` の最初の配列に馬番リストが入ります。`axis`, `partners` は空です。
  * 例 (馬連 5-10): `selections: [["05", "10"]]`
* **FORMATION**: 着順ごとに `selections` の配列が分かれます。
  * 例 (3連単 1着:5, 2着:6,10, 3着:全): `selections: [["05"], ["06", "10"], ["01"..."18"]]`
* **NAGASHI**: `axis` に軸馬、`partners` に相手馬が入ります。`selections` は空です。

## 5. エラーハンドリング

* **画像取得失敗**: `status: error`, `error_message: "Failed to download image"`
* **解析失敗**: `status: error`, `error_message: "Analysis failed"` (またはGeminiのエラー詳細)
* **例外発生**: `status: error`, `error_message: (Pythonの例外メッセージ)`

## 6. 環境変数

以下の環境変数が設定されている必要があります。

* `GOOGLE_API_KEY`: Gemini API用
* `GOOGLE_APPLICATION_CREDENTIALS`: GCS サービスアカウントキー (JSONパス)
* `GCS_BUCKET_NAME`: 保存先GCSバケット名
* `SUPABASE_URL`, `SUPABASE_KEY`: Supabase接続用
