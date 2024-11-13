const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const { exec } = require('child_process');

// Chrome 浏览器的不安全端口列表
const BLOCKED_PORTS = new Set([
    1, 7, 9, 11, 13, 15, 17, 19, 20, 21, 22, 23, 25, 37, 42, 43, 53, 77, 79, 87, 95, 101, 102, 103, 104, 109, 110, 111, 113, 115,
    117, 119, 123, 135, 139, 143, 179, 389, 465, 512, 513, 514, 515, 526, 530, 531, 532, 540, 556, 563, 587, 601, 636, 993, 995,
    2049, 3659, 4045, 6000, 6665, 6666, 6667, 6668, 6669, 6697,
]);

const app = express();
const port = 3006; // 固定使用3006端口

// 检查端口安全性
if (BLOCKED_PORTS.has(port)) {
    console.error('\n错误: 当前使用的端口被Chrome浏览器禁用');
    console.error('请修改源代码中的端口号。建议使用: 3000, 8080, 8000, 5000, 4000\n');
    process.exit(1);
}

// 配置文件存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        cb(null, `${timestamp}-${file.originalname}`);
    },
});

// 配置文件大小限制 (5GB)
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 * 1024,
    },
});

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.json());

// 上传文件接口
app.post('/upload', upload.array('files'), (req, res) => {
    res.json({
        success: true,
        files: req.files.map(file => ({
            name: file.originalname,
            size: file.size,
            path: file.filename,
            uploadTime: Date.now(),
        })),
    });
});

// 保存粘贴文本接口
app.post('/save-text', (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ success: false, error: '文本内容不能为空' });
    }

    const timestamp = Date.now();
    const filename = `text_${timestamp}.txt`;
    const filepath = path.join('uploads', filename);

    fs.writeFile(filepath, text, err => {
        if (err) {
            return res.status(500).json({ success: false, error: '保存文本失败' });
        }
        res.json({
            success: true,
            file: {
                name: filename,
                size: Buffer.from(text).length,
                path: filename,
                uploadTime: timestamp,
            },
        });
    });
});

// 获取文件列表接口
app.get('/files', (req, res) => {
    fs.readdir('uploads', (err, files) => {
        if (err) {
            return res.status(500).json({ success: false, error: '读取文件列表失败' });
        }

        Promise.all(
            files.map(filename => {
                return new Promise((resolve, reject) => {
                    fs.stat(path.join('uploads', filename), (err, stats) => {
                        if (err) reject(err);

                        const timestamp = parseInt(filename.split('-')[0]);
                        const uploadTime = filename.startsWith('text_') ? parseInt(filename.split('_')[1]) : timestamp;

                        resolve({
                            name: filename.startsWith('text_') ? filename : filename.substring(filename.indexOf('-') + 1),
                            path: filename,
                            size: stats.size,
                            uploadTime: uploadTime || stats.ctimeMs,
                        });
                    });
                });
            })
        )
            .then(fileList => {
                fileList.sort((a, b) => b.uploadTime - a.uploadTime);
                res.json({ success: true, files: fileList });
            })
            .catch(err => {
                res.status(500).json({ success: false, error: '获取文件信息失败' });
            });
    });
});

// 批量删除文件接口
app.post('/delete', (req, res) => {
    const { files } = req.body;
    if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ success: false, error: '无效的文件列表' });
    }

    Promise.all(
        files.map(filename => {
            return new Promise((resolve, reject) => {
                fs.unlink(path.join('uploads', filename), err => {
                    if (err) reject(err);
                    resolve(filename);
                });
            });
        })
    )
        .then(() => {
            res.json({ success: true, message: '文件删除成功' });
        })
        .catch(err => {
            res.status(500).json({ success: false, error: '删除文件失败' });
        });
});

// 获取本机IP地址
function getLocalIPs() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const results = [];

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (!net.internal && net.family === 'IPv4') {
                results.push(net.address);
            }
        }
    }
    return results;
}

// 在默认浏览器中打开URL
function openBrowser(url) {
    let command;
    switch (process.platform) {
        case 'darwin': // macOS
            command = `open ${url}`;
            break;
        case 'win32': // Windows
            command = `start ${url}`;
            break;
        default: // Linux
            command = `xdg-open ${url}`;
            break;
    }

    exec(command, err => {
        if (err) {
            console.log('无法自动打开浏览器，请手动访问上述地址');
        }
    });
}

// 打印服务器信息和二维码
function displayServerInfo() {
    const localUrl = `http://localhost:${port}`;
    console.log('\n文件传输服务已启动!\n');
    console.log(`本机访问地址: ${localUrl}`);

    const ips = getLocalIPs();
    if (ips.length > 0) {
        console.log('\n局域网访问地址:');
        ips.forEach((ip, index) => {
            const url = `http://${ip}:${port}`;
            console.log(`\n[地址 ${index + 1}] ${url}`);
            console.log('\n手机扫描下方二维码访问:');
            qrcode.generate(url, { small: true });
        });
    }

    console.log('\n提示：电脑和手机需要在同一局域网内');
    console.log('按 Ctrl+C 停止服务\n');

    // 延迟一秒打开浏览器，等待服务器完全启动
    setTimeout(() => {
        openBrowser(localUrl);
    }, 1000);
}

// 启动服务器
app.listen(port, '0.0.0.0', displayServerInfo).on('error', err => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n错误: 端口 ${port} 已被占用`);
        console.error('请关闭占用该端口的程序后重试\n');
    } else {
        console.error(`\n启动服务器失败: ${err.message}\n`);
    }
    process.exit(1);
});
