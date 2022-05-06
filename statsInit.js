import Stats from "./stats.module";

export function initStats() {
    const stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    stats.dom.style.left = '';
    stats.dom.style.right = '0px';
    stats.dom.style.transform = 'scale(1.5)';
    stats.dom.style.transformOrigin = 'top right';
    stats.dom.style.opacity = '1';
    document.body.appendChild(stats.dom);

    return stats;
};