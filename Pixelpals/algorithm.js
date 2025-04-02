/* Dropdown menu của shape */

document.addEventListener("DOMContentLoaded", function () {
    const shapeButton = document.querySelector(".shape-list");
    const subShapeList = document.querySelector(".sub-shape-list");

    shapeButton.addEventListener("click", function (event) {
        event.stopPropagation();
        subShapeList.classList.toggle("active");
    });

    document.addEventListener("click", function (event) {
        if (!shapeButton.contains(event.target) && !subShapeList.contains(event.target)) {
            subShapeList.classList.remove("active");
        }
    });

    document.querySelectorAll(".draw-shape").forEach(item => {
        item.addEventListener("click", function (event) {
            event.preventDefault(); 
            subShapeList.classList.remove("active"); 
        });
    });
});

/* Khởi tạo canvas */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let isFilling = false;
let currentTool = "";
let currentColor = '#000000';
let startX, startY, endX, endY;
let prevMouseX, prevMouseY, snapshot;
let eraserSize = 10;
let offsetX, offsetY;
let canvasSnapshot;
let elements = [];


window.addEventListener("load", () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
});

const selectTool = (tool) => {
    currentTool = tool;
    ctx.lineWidth = tool === "pen" ? 1 : 0.5;
    ctx.setLineDash([]);
};



/* Thuật toán Bresenham vẽ đường thẳng */
function drawLine(x1, y1, x2, y2) {
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    let sx = x1 < x2 ? 1 : -1;
    let sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    while (true) {
        ctx.fillStyle = currentColor;
        ctx.fillRect(x1, y1, 1, 1);
        if (x1 === x2 && y1 === y2) break;
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x1 += sx; }
        if (e2 < dx) { err += dx; y1 += sy; }
    }
}
const drawingLine = (e) => {
    ctx.beginPath();
    ctx.strokeStyle = currentColor;
    ctx.moveTo(startX, startY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ctx.closePath();
}


/* Vẽ hình chữ nhật */
function drawRectangle(x1, y1, x2, y2) {
    ctx.lineWidth = 0.1;
    let left = Math.min(x1, x2);
    let right = Math.max(x1, x2);
    let top = Math.min(y1, y2);
    let bottom = Math.max(y1, y2);

    drawLine(left, top, right, top); 
    drawLine(left, bottom, right, bottom); 
    drawLine(left, top, left, bottom);
    drawLine(right, top, right, bottom); 
}
const drawingRectangle = (e) => {
    let left = Math.min(startX, e.offsetX);
    let top = Math.min(startY, e.offsetY);
    let width = Math.abs(e.offsetX - startX);
    let height = Math.abs(e.offsetY - startY);

    ctx.putImageData(snapshot, 0, 0); 
    ctx.beginPath();
    ctx.strokeStyle = currentColor;
    ctx.strokeRect(left, top, width, height);
    ctx.closePath();
}



/* Vẽ hình tròn */
function drawCircle(xc, yc, r) {
    let x = 0, y = r;
    let p = 3 - 2 * r;

    function plotCirclePoints(xc, yc, x, y) {
        ctx.fillStyle = currentColor;
        ctx.fillRect(xc + x, yc + y, 1, 1);
        ctx.fillRect(xc - x, yc + y, 1, 1);
        ctx.fillRect(xc + x, yc - y, 1, 1);
        ctx.fillRect(xc - x, yc - y, 1, 1);
        ctx.fillRect(xc + y, yc + x, 1, 1);
        ctx.fillRect(xc - y, yc + x, 1, 1);
        ctx.fillRect(xc + y, yc - x, 1, 1);
        ctx.fillRect(xc - y, yc - x, 1, 1);
    }

    while (x <= y) {
        plotCirclePoints(xc, yc, x, y);
        x++;

        if (p < 0) {
            p += 4 * x + 6;
        } else {
            y--;
            p += 4 * (x - y) + 10;
        }
    }
}
 const drawingCircle = (e) => {
    let radius = Math.sqrt((e.offsetX - prevMouseX) ** 2 + (e.offsetY - prevMouseY) ** 2);
    ctx.beginPath(); 
    ctx.strokeStyle = currentColor;
    ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
    ctx.stroke(); 
    ctx.closePath();
 }


 /* Vẽ hình tam giác */
function drawTriangle(x1, y1, x2, y2, x3, y3) {
    drawLine(x1, y1, x2, y2);
    drawLine(x2, y2, x3, y3); 
    drawLine(x3, y3, x1, y1); 
}
const drawingTriangle = (e) => {
    let x1 = startX, y1 = startY;
    let x2 = e.offsetX, y2 = e.offsetY;
    let x3 = x1 - (x2 - x1), y3 = y2;

    ctx.beginPath();
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = currentColor;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.stroke();
}


/* Điều chỉnh eraser */
const erasing = (e) => {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = eraserSize;
    ctx.lineCap = "round";
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over"; 
    canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

document.addEventListener("DOMContentLoaded", function () {
    const eraserButton = document.getElementById("eraser");
    const eraserSlider = document.getElementById("eraser-size");
    const canvas = document.getElementById("canvas");

    // Lấy danh sách tất cả các công cụ (trừ eraser)
    const toolButtons = document.querySelectorAll(".tools-left button, .tools-top button, .tools-bottom button");

    let isEraserActive = false; 

    // Khi bấm vào Eraser
    eraserButton.addEventListener("click", function (event) {
        event.stopPropagation(); // Ngăn sự kiện lan ra ngoài

        // Nếu thanh trượt đang ẩn -> hiện, nếu đang hiện -> ẩn
        if (!isEraserActive) {
            eraserSlider.style.display = "block";
            isEraserActive = true;
            selectTool("eraser");
        } else {
            eraserSlider.style.display = "none";
            isEraserActive = false;
        }
    });

    // Khi chọn công cụ khác, ẩn thanh trượt eraser
    toolButtons.forEach(button => {
        if (button !== eraserButton) {
            button.addEventListener("click", function () {
                eraserSlider.style.display = "none";
                isEraserActive = false;
            });
        }
    });

    // Khi bắt đầu xóa, giữ trạng thái eraser đang hoạt động
    canvas.addEventListener("mousedown", function () {
        if (currentTool === "eraser") {
            isEraserActive = true;
        }
    });

    // Khi nhả chuột sau khi dùng eraser, giữ thanh trượt hiển thị
    canvas.addEventListener("mouseup", function () {
        if (currentTool === "eraser") {
            eraserSlider.style.display = "block";
        }
    });

    // Nếu nhấn ra ngoài (trừ eraser và thanh trượt), thì ẩn thanh trượt
    document.addEventListener("click", function (event) {
        if (!eraserButton.contains(event.target) && !eraserSlider.contains(event.target) && !canvas.contains(event.target)) {
            eraserSlider.style.display = "none";
            isEraserActive = false;
        }
    });
});


/* Chọn màu */
let colorPicker; 

function setup() {
    noCanvas(); 

    colorPicker = createColorPicker(currentColor);
    colorPicker.style('display', 'none'); 
    colorPicker.parent(document.body);

    colorPicker.elt.style.border = "none";
    colorPicker.elt.style.background = "none";
    colorPicker.elt.style.width = "0px";
    colorPicker.elt.style.height = "0px";
    colorPicker.elt.style.padding = "0";
    colorPicker.elt.style.overflow = "hidden";

    colorPicker.input(() => {
        currentColor = colorPicker.value();
        ctx.strokeStyle = currentColor; 
    });
}


/* Thuật toán flood fill để tô màu */
function floodFill(x, y, newColor) {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    let getPixelIndex = (x, y) => (y * canvas.width + x) * 4;

    let oldColor = data.slice(getPixelIndex(x, y), getPixelIndex(x, y) + 4);
    if (JSON.stringify(oldColor) === JSON.stringify(newColor)) return; 
    let queue = [[x, y]];
    let visited = new Set();
    let pixelsPerFrame = 100; 

    function processNextBatch() {
        let pixelsProcessed = 0;

        while (queue.length > 0 && pixelsProcessed < pixelsPerFrame) {
            let [cx, cy] = queue.shift();
            let index = getPixelIndex(cx, cy);
            
            if (cx < 0 || cy < 0 || cx >= canvas.width || cy >= canvas.height || visited.has(`${cx},${cy}`)) continue;

            let currentColor = data.slice(index, index + 4);
            if (JSON.stringify(currentColor) !== JSON.stringify(oldColor)) continue;

            
            data[index] = newColor[0]; // R
            data[index + 1] = newColor[1]; // G
            data[index + 2] = newColor[2]; // B
            data[index + 3] = 255; // Alpha

            visited.add(`${cx},${cy}`);
            pixelsProcessed++;

            // Thêm pixel lân cận vào hàng đợi
            queue.push([cx + 1, cy]);
            queue.push([cx - 1, cy]);
            queue.push([cx, cy + 1]);
            queue.push([cx, cy - 1]);
        }

        ctx.putImageData(imageData, 0, 0);

        if (queue.length > 0) {
            requestAnimationFrame(processNextBatch);
        }
    }

    requestAnimationFrame(processNextBatch);

        canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}


/* Đưa image trong library lên main page */
window.addEventListener("load", () => {
    // Khởi tạo kích thước canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Lấy ảnh từ localStorage
    const libraryImage = localStorage.getItem('selectedLibraryImage');
    if (libraryImage) {
        const img = new Image();
        img.src = libraryImage === 'image1-button.png' ? 'library-image/image1.png' : 
            libraryImage === 'image2-button.png' ? 'library-image/image2.png' : 
            libraryImage === 'image3-button.png' ? 'library-image/image3.png' : 
            libraryImage === 'image4-button.png' ? 'library-image/image4.png' : 
            libraryImage === 'image5-button.png' ? 'library-image/image5.png' : 
            libraryImage === 'image6-button.png' ? 'library-image/image6.png' : libraryImage;

        img.onload = function() {
            const imgRatio = img.width / img.height;
            const canvasRatio = canvas.width / canvas.height;
            let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

            if (imgRatio > canvasRatio) {
                drawWidth = canvas.width;
                drawHeight = canvas.width / imgRatio;
                offsetY = (canvas.height - drawHeight) / 2;
            } else {
                drawHeight = canvas.height;
                drawWidth = canvas.height * imgRatio;
                offsetX = (canvas.width - drawWidth) / 2;
            }

            // Vẽ ảnh lên canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        };

        // Xóa key sau khi sử dụng
        localStorage.removeItem('selectedLibraryImage');
    }
});


/* Thuật toán flood fill cho hình */
function floodFillImage(x, y, newColor) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixelStack = [[x, y]];
    const startColor = getPixelColor(imageData, x, y);
  
    while (pixelStack.length) {
        const [currentX, currentY] = pixelStack.pop();
        if (currentX < 0 || currentX >= canvas.width || currentY < 0 || currentY >= canvas.height) continue;
        
        const currentColor = getPixelColor(imageData, currentX, currentY);
        if (colorsMatch(currentColor, startColor)) {
            setPixelColor(imageData, currentX, currentY, newColor);
            pixelStack.push(
            [currentX + 1, currentY],
            [currentX - 1, currentY],
            [currentX, currentY + 1],
            [currentX, currentY - 1]
            );
        }
    }
    ctx.putImageData(imageData, 0, 0);
}


/* Công cụ undo */
const undoStack = [];

function saveState() {
    if (undoStack.length > 20) { 
        undoStack.shift(); 
    }
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

function undo() {
    if (undoStack.length > 1) { 
        const previousState = undoStack.pop();
        ctx.putImageData(previousState, 0, 0);
    } else if (undoStack.length === 1) {
        const initialState = undoStack[0];
        ctx.putImageData(initialState, 0, 0);
    }
}


/* Bắt đầu vẽ */
const startDraw = (e) => {
    isDrawing = true;
    startX = e.offsetX;
    startY = e.offsetY;
    prevMouseX = e.offsetX;
    prevMouseY = e.offsetY;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
};


/* Khi kéo chuột */
const drawing = (e) => {
    if (!isDrawing) return;
    ctx.putImageData(snapshot, 0, 0);

    if (currentTool === "pen") {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    } else if (currentTool === "line") {
        drawingLine(e);
    } else if (currentTool === "rectangle") {
        drawingRectangle(e);
    } else if (currentTool === "circle") {
        drawingCircle(e);
    } else if (currentTool === "triangle") {
        drawingTriangle(e);
    } else if (currentTool === "eraser") {
        erasing(e);
    }
};


/* Dừng vẽ */
const stopDraw = (e) => {
    if (!isDrawing) return;
    isDrawing = false;
    endX = e.offsetX;
    endY = e.offsetY;

    if (currentTool === "pen") {
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.closePath();
    } else if (currentTool === "line") {
        drawLine(startX, startY, endX, endY);
    } else if (currentTool === "rectangle") {
        drawRectangle(startX, startY, endX, endY);
    } else if (currentTool === "circle") {
        let radius = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        drawCircle(startX, startY, Math.round(radius));
    } else if (currentTool === "triangle") {
        let x1 = startX, y1 = startY;
        let x2 = endX, y2 = endY;
        let x3 = x1 - (x2 - x1), y3 = y2;
        drawTriangle(x1, y1, x2, y2, x3, y3);
    } else if (currentTool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = eraserSize;
        ctx.lineCap = "round";
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.closePath();
        ctx.globalCompositeOperation = "source-over";
    }

    saveState();
};

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("click", (e) => {
    if (currentTool === "bucket") {
        let newColor = [
            parseInt(currentColor.slice(1, 3), 16),
            parseInt(currentColor.slice(3, 5), 16),
            parseInt(currentColor.slice(5, 7), 16),
            255
        ];
        floodFill(e.offsetX, e.offsetY, newColor);

        saveState();
    }
});


document.getElementById("pen").addEventListener("click", () => {
    selectTool("pen"); 
});

document.getElementById("line").addEventListener("click", () => {
    selectTool("line");
});

document.getElementById("rectangle").addEventListener("click", (e) => {
    e.preventDefault();
    selectTool("rectangle");
});

document.getElementById("circle").addEventListener("click", (e) => {
    e.preventDefault();
    selectTool("circle");
});

document.getElementById("triangle").addEventListener("click", (e) => {
    e.preventDefault();
    selectTool("triangle");
});

document.getElementById("eraser-size").addEventListener("input", function () {
    eraserSize = this.value;
});

document.getElementById("eraser").addEventListener("click", function() {
    selectTool("eraser");
});

document.getElementById("palette").addEventListener("click", () => {
    colorPicker.elt.style.display = "block"; 
    colorPicker.elt.click(); 
});

document.getElementById("bucket").addEventListener("click", () => {
    selectTool("bucket");
});

document.getElementById("clearCanvas").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

document.getElementById("save").addEventListener("click", () => {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    tempCtx.fillStyle = "#FFFFFF"; 
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    tempCtx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `${Date.now()}.jpg`;
    link.href = tempCanvas.toDataURL("image/jpeg", 1.0);
    link.click();
});

document.addEventListener("DOMContentLoaded", function () {
    const uploadButton = document.getElementById("upload");
    const imageUploadInput = document.getElementById("image-upload");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();

    // Khi nhấn nút upload, kích hoạt input file
    uploadButton.addEventListener("click", () => {
        imageUploadInput.click();
    });

    // Khi người dùng chọn tệp ảnh
    imageUploadInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const img = new Image();
            const reader = new FileReader();

            // Đọc tệp ảnh
            reader.onload = function (e) {
                img.src = e.target.result;
            };

            // Khi ảnh được tải xong
            img.onload = function () {
                // Tính toán để vẽ ảnh vừa khít với canvas
                const imgRatio = img.width / img.height;
                const canvasRatio = canvas.width / canvas.height;
                let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

                if (imgRatio > canvasRatio) {
                    drawWidth = canvas.width;
                    drawHeight = canvas.width / imgRatio;
                    offsetY = (canvas.height - drawHeight) / 2;
                } else {
                    drawHeight = canvas.height;
                    drawWidth = canvas.height * imgRatio;
                    offsetX = (canvas.width - drawWidth) / 2;
                }

                // Xóa canvas và vẽ ảnh
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            };

            // Đọc tệp ảnh dưới dạng URL
            reader.readAsDataURL(file);
        }
    });
});

document.getElementById("undo").addEventListener("click", () => {
    undo();
});

// Danh sách các công cụ
const tools = [
    "pen", "eraser", "line", "rectangle", "circle", "triangle", 
    "bucket", "palette", "selection", "text", "shape-list"
];

function resetToolImages() {
    tools.forEach((tool) => {
        const img = document.getElementById(`${tool}-img`);
        if (img) {
            img.src = `main-image/${tool}.png`;
            img.classList.remove("active"); 
        }
    });
}

tools.forEach((tool) => {
    const button = document.getElementById(tool);
    if (button) {
        button.addEventListener("click", () => {
            resetToolImages();

            const selectedImg = document.getElementById(`${tool}-img`);
            if (selectedImg) {
                selectedImg.src = `main-image/${tool}2.png`; 
                selectedImg.classList.add("active"); 
            }
        });
    }
});




