// 完整的後端伺服器範例
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// 中間件設定
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB 連接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jump-rope-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 影片模型
const videoSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  teacherFeedback: [{
    teacherId: String,
    comment: String,
    date: { type: Date, default: Date.now }
  }]
});

const Video = mongoose.model('Video', videoSchema);

// AWS S3 設定
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-southeast-1'
});

// Multer 設定
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB 限制
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('只允許上傳影片檔案'));
    }
  }
});

// 影片上傳端點
app.post('/api/upload-video', upload.single('video'), async (req, res) => {
  try {
    const file = req.file;
    const studentId = req.body.studentId;
    const description = req.body.description;

    if (!file) {
      return res.status(400).json({ error: '沒有選擇檔案' });
    }

    if (!studentId || !description) {
      return res.status(400).json({ error: '缺少必要參數' });
    }

    // 上傳到 S3
    const uploadResult = await s3.upload({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `videos/${studentId}/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    }).promise();

    // 儲存到資料庫
    const videoRecord = new Video({
      studentId,
      description,
      videoUrl: uploadResult.Location,
      fileName: file.originalname,
      fileSize: file.size,
      uploadDate: new Date()
    });

    await videoRecord.save();
    
    console.log(`影片上傳成功: ${uploadResult.Location}`);
    res.json({ 
      success: true, 
      videoUrl: uploadResult.Location,
      videoId: videoRecord._id
    });

  } catch (error) {
    console.error('影片上傳失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 取得所有影片
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ uploadDate: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得特定學生的影片
app.get('/api/videos/student/:studentId', async (req, res) => {
  try {
    const videos = await Video.find({ studentId: req.params.studentId }).sort({ uploadDate: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 老師審核影片
app.post('/api/videos/:videoId/review', async (req, res) => {
  try {
    const { status, comment, teacherId } = req.body;
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({ error: '影片不存在' });
    }

    if (status === 'approved' || status === 'rejected') {
      video.status = status;
      if (comment) {
        video.teacherFeedback.push({
          teacherId: teacherId || '老師',
          comment: comment
        });
      }
      await video.save();
      res.json({ success: true, video });
    } else {
      res.status(400).json({ error: '無效的狀態' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 刪除影片
app.delete('/api/videos/:videoId', async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ error: '影片不存在' });
    }

    // 從 S3 刪除檔案
    const key = video.videoUrl.split('/').slice(-2).join('/');
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    }).promise();

    // 從資料庫刪除記錄
    await Video.findByIdAndDelete(req.params.videoId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 健康檢查端點
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 錯誤處理中間件
app.use((error, req, res, next) => {
  console.error('伺服器錯誤:', error);
  res.status(500).json({ error: '內部伺服器錯誤' });
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`伺服器運行在 port ${PORT}`);
  console.log(`健康檢查: http://localhost:${PORT}/api/health`);
});

module.exports = app; 