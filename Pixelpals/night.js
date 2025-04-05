const tools_on_click = [
    "pen", "eraser", "line", "rectangle", "circle", "triangle", 
    "bucket", "palette", "shape-list"
];

function resetToolImages() {
    tools_on_click.forEach((tool) => {
        const img = document.getElementById(`${tool}-img`);
        if (img) {
            img.src = `main-night-image/${tool}3.png`;
            img.classList.remove("active"); 
        }
    });
}

tools_on_click.forEach((tool) => {
    const button = document.getElementById(tool);
    if (button) {
        button.addEventListener("click", () => {
            resetToolImages();

            const selectedImg = document.getElementById(`${tool}-img`);
            if (selectedImg) {
                selectedImg.src = `main-night-image/${tool}4.png`; 
                selectedImg.classList.add("active"); 
            }
        });
    }
});

