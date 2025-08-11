# Firebase 學生成績系統重設指南

## 問題描述
您的 Firebase 資料庫中的學生成績資料被意外移除，需要重新建立和匯入資料。

## 解決方案

### 1. 測試 Firebase 連接
首先使用測試頁面確認 Firebase 連接正常：

1. 開啟瀏覽器，訪問：`http://localhost:8000/test-firebase.html`
2. 點擊「測試認證」按鈕
3. 點擊「測試寫入」按鈕
4. 點擊「測試讀取」按鈕

如果所有測試都成功，表示 Firebase 連接正常。

### 2. 使用修復版匯入工具
使用新的修復版匯入工具來重新建立資料：

1. 開啟：`http://localhost:8000/import-scores-fixed.html`
2. 系統會自動檢查 Firebase 連接狀態
3. 點擊「建立範例資料」按鈕來建立測試資料
4. 或使用 `sample-scores.json` 檔案進行匯入

### 3. 匯入您的成績資料
準備您的 JSON 檔案，格式如下：

```json
{
  "scores": [
    {
      "name": "學生姓名",
      "front": 10,
      "jack": 15,
      "ski": 20,
      "bike": 25,
      "date": "2024-01-15"
    }
  ]
}
```

### 4. 資料庫操作功能

#### 檢查現有學生
- 點擊「檢查現有學生」按鈕查看目前資料庫中的學生

#### 建立範例資料
- 點擊「建立範例資料」按鈕自動建立測試資料

#### 清除所有資料
- 點擊「清除所有資料」按鈕可以清除所有學生和成績資料
- **警告：此操作無法復原！**

### 5. 查看成績
匯入完成後，您可以：

1. 訪問 `http://localhost:8000/students-list.html` 查看學生名單
2. 點擊學生照片進入個人專區查看成績
3. 或直接訪問 `http://localhost:8000/cloud-student.html?id=學生ID`

## 檔案說明

- `import-scores-fixed.html` - 修復版匯入工具（推薦使用）
- `import-scores.html` - 原始匯入工具
- `test-firebase.html` - Firebase 連接測試工具
- `sample-scores.json` - 範例成績資料檔案

## 常見問題

### Q: 匯入失敗怎麼辦？
A: 
1. 檢查 JSON 檔案格式是否正確
2. 確認 Firebase 連接正常
3. 查看瀏覽器控制台的錯誤訊息

### Q: 如何備份資料？
A: 目前系統沒有自動備份功能，建議定期匯出 JSON 資料作為備份。

### Q: Firebase 規則問題？
A: 如果遇到權限錯誤，請檢查 Firebase Console 中的 Firestore 規則設定。

## 技術支援

如果遇到問題，請檢查：
1. 瀏覽器控制台的錯誤訊息
2. Firebase Console 中的日誌
3. 網路連接狀態

---

**注意：** 本指南假設您已經啟動了本地伺服器（`python -m http.server 8000`）
