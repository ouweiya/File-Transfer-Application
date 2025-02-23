// 全局变量
let selectedFiles = new Set();
let autoRefreshInterval = null;

// DOM元素
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const textInput = document.getElementById('textInput');
const fileList = document.getElementById('fileList');
const selectAll = document.getElementById('selectAll');
const autoRefresh = document.getElementById('autoRefresh');
const downloadBtn = document.getElementById('downloadBtn');
const deleteBtn = document.getElementById('deleteBtn');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');

// // 初始化
// document.addEventListener('DOMContentLoaded', () => {
//     initDragAndDrop();
//     initEventListeners();
//     loadFileList();
// });

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initDragAndDrop();
    initEventListeners();
    loadFileList();

    // 初始化时启动自动刷新
    if (autoRefresh.checked) {
        autoRefreshInterval = setInterval(loadFileList, 2000);
    }
});

// 初始化拖放上传
function initDragAndDrop() {
    dropZone.onclick = () => fileInput.click();

    dropZone.ondragover = e => {
        e.preventDefault();
        dropZone.style.borderColor = '#1890ff';
        dropZone.style.background = '#f0f8ff';
    };

    dropZone.ondragleave = () => {
        dropZone.style.borderColor = '#e0e0e0';
        dropZone.style.background = '#fafafa';
    };

    dropZone.ondrop = e => {
        e.preventDefault();
        dropZone.style.borderColor = '#e0e0e0';
        dropZone.style.background = '#fafafa';
        const files = e.dataTransfer.files;
        if (files.length) uploadFiles(files);
    };

    fileInput.onchange = () => {
        if (fileInput.files.length) {
            uploadFiles(fileInput.files);
        }
    };
}

// 初始化事件监听
/* function initEventListeners() {
    // 全选/取消全选
    selectAll.onchange = () => {
        const checkboxes = fileList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = selectAll.checked;
            updateFileSelection(cb);
        });
    };

    // 自动刷新
    autoRefresh.onchange = () => {
        if (autoRefresh.checked) {
            autoRefreshInterval = setInterval(loadFileList, 5000);
        } else {
            clearInterval(autoRefreshInterval);
        }
    };
}
 */
// 在 initEventListeners 函数中添加剪贴板事件监听
// function initEventListeners() {
//     // 保留原有的事件监听代码
//     selectAll.onchange = () => {
//         const checkboxes = fileList.querySelectorAll('input[type="checkbox"]');
//         checkboxes.forEach(cb => {
//             cb.checked = selectAll.checked;
//             updateFileSelection(cb);
//         });
//     };

//     // 自动刷新 - 将时间从5000ms改为2000ms
//     autoRefresh.onchange = () => {
//         if (autoRefresh.checked) {
//             autoRefreshInterval = setInterval(loadFileList, 2000);
//         } else {
//             clearInterval(autoRefreshInterval);
//         }
//     };

//     // 添加剪贴板事件监听
//     document.addEventListener('paste', handlePaste);
// }

// 保持原有的事件监听函数
function initEventListeners() {
    // 全选/取消全选
    selectAll.onchange = () => {
        const checkboxes = fileList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = selectAll.checked;
            updateFileSelection(cb);
        });
    };

    // 自动刷新
    autoRefresh.onchange = () => {
        if (autoRefresh.checked) {
            autoRefreshInterval = setInterval(loadFileList, 2000);
        } else {
            clearInterval(autoRefreshInterval);
        }
    };

    // 剪贴板事件监听
    document.addEventListener('paste', handlePaste);
}

// 处理剪贴板粘贴事件
// 修改 handlePaste 函数以更好地处理各种文件类型
async function handlePaste(e) {
    e.preventDefault();

    const items = e.clipboardData.items;
    const files = [];

    for (let item of items) {
        // 检查是否为文件类型
        if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) {
                // 确保文件有名称和大小
                if (file.name && file.size > 0) {
                    files.push(file);
                }
            }
        }
    }

    if (files.length > 0) {
        // 使用现有的上传函数上传文件
        uploadFiles(files);
    } else {
        // 如果没有文件，检查是否有文本内容
        const text = e.clipboardData.getData('text');
        if (text) {
            textInput.value = text;
        }
    }
}

// 显示进度条
function showProgress(percent) {
    progressBar.style.display = 'block';
    progress.style.width = `${percent}%`;
}

// 隐藏进度条
function hideProgress() {
    setTimeout(() => {
        progressBar.style.display = 'none';
        progress.style.width = '0%';
    }, 1000);
}

// 上传文件
// async function uploadFiles(files) {
//     const formData = new FormData();
//     for (let file of files) {
//         formData.append('files', file);
//     }

//     try {
//         // 显示进度条
//         showProgress(0);

//         const xhr = new XMLHttpRequest();
//         xhr.open('POST', '/upload', true);

//         // 监听上传进度
//         xhr.upload.onprogress = e => {
//             if (e.lengthComputable) {
//                 const percent = (e.loaded / e.total) * 100;
//                 showProgress(percent);
//             }
//         };

//         // 处理上传完成
//         xhr.onload = () => {
//             hideProgress();
//             if (xhr.status === 200) {
//                 const result = JSON.parse(xhr.responseText);
//                 if (result.success) {
//                     loadFileList();
//                 } else {
//                     alert('上传失败：' + result.error);
//                 }
//             } else {
//                 alert('上传失败：服务器错误');
//             }
//         };

//         // 处理上传错误
//         xhr.onerror = () => {
//             hideProgress();
//             alert('上传出错：网络错误');
//         };

//         xhr.send(formData);
//     } catch (error) {
//         hideProgress();
//         alert('上传出错：' + error.message);
//     }

//     fileInput.value = '';
// }

// 修改uploadFiles函数，添加额外的文件类型检查和错误处理
async function uploadFiles(files) {
    // 添加文件类型检查和大小限制的提示
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    const invalidFiles = [];
    const validFiles = [];  // 添加一个数组来跟踪有效文件

    // 检查每个文件
    for (let file of files) {
        if (file.size > maxSize) {
            invalidFiles.push(`${file.name} (超过5GB大小限制)`);
        } else {
            validFiles.push(file);  // 将有效文件添加到数组
        }
    }

    if (invalidFiles.length > 0) {
        alert('以下文件无法上传：\n' + invalidFiles.join('\n'));
        return;
    }

    if (validFiles.length === 0) {
        return; // 如果没有有效文件，直接返回
    }

    const formData = new FormData();
    for (let file of validFiles) {
        formData.append('files', file);
    }

    try {
        showProgress(0);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);

        xhr.upload.onprogress = e => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                showProgress(percent);
            }
        };

        xhr.onload = () => {
            hideProgress();
            if (xhr.status === 200) {
                const result = JSON.parse(xhr.responseText);
                if (result.success) {
                    // 使用服务器返回的文件数量或有效文件数组的长度
                    const fileCount = result.files ? result.files.length : validFiles.length;
                    const message = `成功上传 ${fileCount} 个文件`;
                    showNotification(message);
                    loadFileList();
                } else {
                    alert('上传失败：' + result.error);
                }
            } else {
                alert('上传失败：服务器错误');
            }
        };

        xhr.onerror = () => {
            hideProgress();
            alert('上传出错：网络错误');
        };

        xhr.send(formData);
    } catch (error) {
        hideProgress();
        alert('上传出错：' + error.message);
    }

    if (fileInput) {
        fileInput.value = '';
    }
}

// 更新通知显示函数，添加图标支持
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'upload-notification';

    // 添加成功图标
    notification.innerHTML = `
        <span class="notification-icon">✓</span>
        <span class="notification-message">${message}</span>
    `;

    document.body.appendChild(notification);

    // 2秒后自动移除通知
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 2000);
}

// 保存文本
async function saveText() {
    const text = textInput.value.trim();
    if (!text) {
        alert('请输入要保存的文本');
        return;
    }

    try {
        const response = await fetch('/save-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        const result = await response.json();
        if (result.success) {
            textInput.value = '';
            loadFileList();
        } else {
            alert('保存失败：' + result.error);
        }
    } catch (error) {
        alert('保存出错：' + error.message);
    }
}

// 加载文件列表
async function loadFileList() {
    try {
        const response = await fetch('/files');
        const result = await response.json();

        if (result.success) {
            renderFileList(result.files);
        } else {
            console.error('加载文件列表失败：', result.error);
        }
    } catch (error) {
        console.error('加载文件列表出错：', error);
    }
}

// 渲染文件列表
/* function renderFileList(files) {
    fileList.innerHTML = '';

    files.forEach(file => {
        const tr = document.createElement('tr');
        const isSelected = selectedFiles.has(file.path);

        tr.innerHTML = `
            <td>
                <input type="checkbox" data-file="${file.path}" ${isSelected ? 'checked' : ''}>
            </td>
            <td>
                <a href="/uploads/${file.path}" class="file-link" target="_blank">${file.name}</a>
            </td>
            <td>${formatFileSize(file.size)}</td>
            <td>${formatDate(file.uploadTime)}</td>
        `;

        const checkbox = tr.querySelector('input[type="checkbox"]');
        checkbox.onchange = () => updateFileSelection(checkbox);

        fileList.appendChild(tr);
    });
} */

// 修改 renderFileList 函数中的相关部分
function renderFileList(files) {
    fileList.innerHTML = '';

    files.forEach(file => {
        const tr = document.createElement('tr');
        const isSelected = selectedFiles.has(file.path);

        tr.innerHTML = `
            <td>
            <label class="checkbox-label">
                <input type="checkbox" data-file="${file.path}" ${isSelected ? 'checked' : ''}>
            </label>
            </td>
            <td>
                <a href="/uploads/${file.path}" class="file-link" target="_blank">${file.name}</a>
            </td>
            <td>${formatFileSize(file.size)}</td>
            <td>${formatDate(file.uploadTime)}</td>
            <td class="action-cell">
                <button class="btn btn-download" onclick="downloadSingleFile('${file.path}', '${file.name}')">
                    下载
                </button>
            </td>
        `;

        const checkbox = tr.querySelector('input[type="checkbox"]');
        checkbox.onchange = () => updateFileSelection(checkbox);

        fileList.appendChild(tr);
    });
}
// 添加单文件下载函数
function downloadSingleFile(filePath, originalName) {
    const link = document.createElement('a');
    link.href = `/uploads/${filePath}`;
    link.download = originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 修改单文件下载函数
// function downloadSingleFile(filePath, originalName) {
//     const link = document.createElement('a');
//     link.href = `/uploads/${filePath}`;
//     // 从文件路径中提取原始文件名（去除时间戳前缀）
//     const originalFileName = filePath.includes('-') ?
//         filePath.substring(filePath.indexOf('-') + 1) :
//         filePath;
//     link.download = originalFileName;
//     console.log('originalFileName', originalFileName);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
// }

// 更新文件选择状态
function updateFileSelection(checkbox) {
    const filePath = checkbox.dataset.file;

    if (checkbox.checked) {
        selectedFiles.add(filePath);
    } else {
        selectedFiles.delete(filePath);
        selectAll.checked = false;
    }

    updateButtonStates();
}

// 更新按钮状态
function updateButtonStates() {
    const hasSelection = selectedFiles.size > 0;
    downloadBtn.disabled = !hasSelection;
    deleteBtn.disabled = !hasSelection;
}

// 下载选中文件
// function downloadSelectedFiles() {
//     selectedFiles.forEach(filePath => {
//         const link = document.createElement('a');
//         link.href = `/uploads/${filePath}`;
//         // 从路径中提取原始文件名
//         const originalName = filePath.includes('-') ? filePath.substring(filePath.indexOf('-') + 1) : filePath;
//         link.download = originalName;
//         link.target = '_blank'; // 在新标签页打开
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     });
// }

// 修改批量下载函数
function downloadSelectedFiles() {
    selectedFiles.forEach(filePath => {
        const link = document.createElement('a');
        link.href = `/uploads/${filePath}`;
        // 从文件路径中提取原始文件名
        const originalFileName = filePath.includes('-') ? filePath.substring(filePath.indexOf('-') + 1) : filePath;
        link.download = originalFileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// 删除选中文件
async function deleteSelectedFiles() {
    if (!confirm(`确定要删除选中的 ${selectedFiles.size} 个文件吗？`)) {
        return;
    }

    try {
        const response = await fetch('/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                files: Array.from(selectedFiles),
            }),
        });

        const result = await response.json();
        if (result.success) {
            selectedFiles.clear();
            updateButtonStates();
            loadFileList();
        } else {
            alert('删除失败：' + result.error);
        }
    } catch (error) {
        alert('删除出错：' + error.message);
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化日期
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(
        2,
        '0'
    )} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
