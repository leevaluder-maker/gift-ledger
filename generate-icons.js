/**
 * 礼金记账 App 图标生成器
 * 使用 Node.js Canvas 绘制墨刀设计的图标
 *
 * 运行方式: node generate-icons.js
 *
 * 依赖安装: npm install canvas
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 图标绘制函数 - 完美还原墨刀设计
function drawIcon(ctx, size) {
    const scale = size / 512;

    // 清空画布
    ctx.clearRect(0, 0, size, size);

    // 绘制圆角矩形背景 (iOS 22.5% 圆角率)
    const borderRadius = size * 0.225;
    roundRect(ctx, 0, 0, size, size, borderRadius);

    // 米白到浅灰渐变背景
    const bgGradient = ctx.createLinearGradient(0, 0, 0, size);
    bgGradient.addColorStop(0, '#FDFDFD');
    bgGradient.addColorStop(1, '#F2F2F2');
    ctx.fillStyle = bgGradient;
    ctx.fill();

    // 绘制细腻纹理点
    ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
    for (let x = 0; x < size; x += 4 * scale) {
        for (let y = 0; y < size; y += 4 * scale) {
            ctx.beginPath();
            ctx.arc(x + 2 * scale, y + 2 * scale, 0.5 * scale, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 账本主体位置计算
    const bookWidth = size * 0.65;
    const bookHeight = size * 0.75;
    const bookX = (size - bookWidth) / 2;
    const bookY = (size - bookHeight) / 2;
    const bookRadius = 2 * scale;

    // 账本阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 30 * scale;
    ctx.shadowOffsetX = 10 * scale;
    ctx.shadowOffsetY = 10 * scale;

    // 账本主体背景
    roundRect(ctx, bookX, bookY, bookWidth, bookHeight, bookRadius);
    ctx.fillStyle = '#F9F9F9';
    ctx.fill();

    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 书脊 (左侧)
    const spineWidth = 16 * scale;
    ctx.beginPath();
    ctx.rect(bookX, bookY, spineWidth, bookHeight);
    ctx.fillStyle = '#FAFAFA';
    ctx.fill();

    // 书脊阴影线
    ctx.beginPath();
    ctx.moveTo(bookX + spineWidth, bookY);
    ctx.lineTo(bookX + spineWidth, bookY + bookHeight);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    // 书脊内部阴影
    const spineShadow = ctx.createLinearGradient(bookX, 0, bookX + spineWidth, 0);
    spineShadow.addColorStop(0, 'rgba(0, 0, 0, 0.05)');
    spineShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath();
    ctx.rect(bookX, bookY, spineWidth, bookHeight);
    ctx.fillStyle = spineShadow;
    ctx.fill();

    // 红色书签带
    const bookmarkX = bookX + bookWidth - 16 * scale;
    const bookmarkWidth = 8 * scale;
    const bookmarkHeight = 48 * scale;

    // 书签渐变
    const bookmarkGradient = ctx.createLinearGradient(0, bookY, 0, bookY + bookmarkHeight);
    bookmarkGradient.addColorStop(0, '#DC2626');
    bookmarkGradient.addColorStop(1, '#EF4444');

    ctx.beginPath();
    ctx.rect(bookmarkX, bookY, bookmarkWidth, bookmarkHeight);
    ctx.fillStyle = bookmarkGradient;
    ctx.fill();

    // 书签底部切角
    ctx.beginPath();
    ctx.moveTo(bookmarkX, bookY + bookmarkHeight);
    ctx.lineTo(bookmarkX + bookmarkWidth / 2, bookY + bookmarkHeight + 8 * scale);
    ctx.lineTo(bookmarkX + bookmarkWidth, bookY + bookmarkHeight);
    ctx.fillStyle = '#F9F9F9';
    ctx.fill();

    // 封面装饰线 (右上角)
    ctx.beginPath();
    ctx.moveTo(bookX + bookWidth - 28 * scale, bookY + 16 * scale);
    ctx.lineTo(bookX + bookWidth - 60 * scale, bookY + 16 * scale);
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    // 封面装饰线 (右下角)
    ctx.beginPath();
    ctx.moveTo(bookX + bookWidth - 28 * scale, bookY + bookHeight - 16 * scale);
    ctx.lineTo(bookX + bookWidth - 60 * scale, bookY + bookHeight - 16 * scale);
    ctx.stroke();

    // 红色细绳 (缠绕书脊) - 左移
    const ropeX = bookX + bookWidth * 0.30;
    ctx.beginPath();
    ctx.moveTo(ropeX, bookY);
    ctx.lineTo(ropeX, bookY + bookHeight);
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.8)';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // 细绳阴影
    ctx.beginPath();
    ctx.moveTo(ropeX + 1 * scale, bookY);
    ctx.lineTo(ropeX + 1 * scale, bookY + bookHeight);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    // 中国结装饰点
    const knotY = bookY + bookHeight * 0.45;
    const knotRadius = 5 * scale;

    ctx.beginPath();
    ctx.arc(ropeX, knotY, knotRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#B91C1C';
    ctx.fill();
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    // 小高光
    ctx.beginPath();
    ctx.arc(ropeX - 1.5 * scale, knotY - 1.5 * scale, 1.5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();

    // 封面"极简"文字 - 竖向排布
    // Android 中大尺寸(72-192): 行高1.5, Web大尺寸(180-512): 字体50, 行高1.6
    const isLargeIcon = size >= 72;
    const isWebLarge = size >= 180;
    const fontSize = isWebLarge ? Math.max(14, Math.floor(50 * scale)) : Math.max(12, Math.floor(44 * scale));
    const lineHeight = isWebLarge ? fontSize * 1.6 : (isLargeIcon ? fontSize * 1.5 : fontSize * 1.4);

    const textX = bookX + bookWidth / 2 + 30 * scale;
    const textY = bookY + bookHeight / 2;

    ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 文字阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillText('极', textX + 1 * scale, textY - lineHeight / 2 + 1 * scale);
    ctx.fillText('简', textX + 1 * scale, textY + lineHeight / 2 + 1 * scale);

    // 文字主体 - 深灰色
    ctx.fillStyle = '#4A4A4A';
    ctx.fillText('极', textX, textY - lineHeight / 2);
    ctx.fillText('简', textX, textY + lineHeight / 2);
}

// 圆角矩形辅助函数
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// 生成并保存图标
function generateIcon(size, filepath) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    drawIcon(ctx, size);

    const buffer = canvas.toBuffer('image/png');
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, buffer);
    console.log(`✓ 生成: ${path.relative(process.cwd(), filepath)} (${size}x${size})`);
}

// Android 图标配置
const androidIcons = [
    { folder: 'mipmap-mdpi', size: 48 },
    { folder: 'mipmap-hdpi', size: 72 },
    { folder: 'mipmap-xhdpi', size: 96 },
    { folder: 'mipmap-xxhdpi', size: 144 },
    { folder: 'mipmap-xxxhdpi', size: 192 },
];

// iOS 图标配置
const iosIcons = [
    { filename: 'Icon-App-20x20@2x.png', size: 40 },
    { filename: 'Icon-App-20x20@3x.png', size: 60 },
    { filename: 'Icon-App-29x29@2x.png', size: 58 },
    { filename: 'Icon-App-29x29@3x.png', size: 87 },
    { filename: 'Icon-App-40x40@2x.png', size: 80 },
    { filename: 'Icon-App-40x40@3x.png', size: 120 },
    { filename: 'Icon-App-60x60@2x.png', size: 120 },
    { filename: 'Icon-App-60x60@3x.png', size: 180 },
    { filename: 'Icon-App-76x76@2x.png', size: 152 },
    { filename: 'Icon-App-83.5x83.5@2x.png', size: 167 },
    { filename: 'Icon-App-1024x1024.png', size: 1024 },
];

// 项目路径
const projectRoot = path.resolve(__dirname);
const androidResPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');
const iosAssetsPath = path.join(projectRoot, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

console.log('\n📒 极简账本 App 图标生成器\n');
console.log('=' .repeat(50));

// 生成 Android 图标
console.log('\n📱 生成 Android 图标...\n');
androidIcons.forEach(({ folder, size }) => {
    // ic_launcher.png
    generateIcon(size, path.join(androidResPath, folder, 'ic_launcher.png'));
    // ic_launcher_round.png
    generateIcon(size, path.join(androidResPath, folder, 'ic_launcher_round.png'));
});

// 生成自适应图标前景 (108dp base)
console.log('\n🎨 生成自适应图标前景...\n');
const adaptiveSizes = [
    { folder: 'mipmap-mdpi', size: 108 },
    { folder: 'mipmap-hdpi', size: 162 },
    { folder: 'mipmap-xhdpi', size: 216 },
    { folder: 'mipmap-xxhdpi', size: 324 },
    { folder: 'mipmap-xxxhdpi', size: 432 },
];

adaptiveSizes.forEach(({ folder, size }) => {
    generateIcon(size, path.join(androidResPath, folder, 'ic_launcher_foreground.png'));
});

// 更新自适应图标背景色
console.log('\n🎨 更新自适应图标背景...\n');
const backgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportHeight="108"
    android:viewportWidth="108">
    <path
        android:fillColor="#F5F5F5"
        android:pathData="M0,0h108v108h-108z" />
</vector>`;

fs.writeFileSync(path.join(androidResPath, 'drawable', 'ic_launcher_background.xml'), backgroundXml);
console.log('✓ 更新: drawable/ic_launcher_background.xml');

// 生成 iOS 图标 (如果 iOS 目录存在)
if (fs.existsSync(path.dirname(iosAssetsPath))) {
    console.log('\n🍎 生成 iOS 图标...\n');
    fs.mkdirSync(iosAssetsPath, { recursive: true });

    iosIcons.forEach(({ filename, size }) => {
        generateIcon(size, path.join(iosAssetsPath, filename));
    });

    // 生成 Contents.json
    const contentsJson = {
        images: [
            { filename: 'Icon-App-20x20@2x.png', idiom: 'iphone', scale: '2x', size: '20x20' },
            { filename: 'Icon-App-20x20@3x.png', idiom: 'iphone', scale: '3x', size: '20x20' },
            { filename: 'Icon-App-29x29@2x.png', idiom: 'iphone', scale: '2x', size: '29x29' },
            { filename: 'Icon-App-29x29@3x.png', idiom: 'iphone', scale: '3x', size: '29x29' },
            { filename: 'Icon-App-40x40@2x.png', idiom: 'iphone', scale: '2x', size: '40x40' },
            { filename: 'Icon-App-40x40@3x.png', idiom: 'iphone', scale: '3x', size: '40x40' },
            { filename: 'Icon-App-60x60@2x.png', idiom: 'iphone', scale: '2x', size: '60x60' },
            { filename: 'Icon-App-60x60@3x.png', idiom: 'iphone', scale: '3x', size: '60x60' },
            { filename: 'Icon-App-76x76@2x.png', idiom: 'ipad', scale: '2x', size: '76x76' },
            { filename: 'Icon-App-83.5x83.5@2x.png', idiom: 'ipad', scale: '2x', size: '83.5x83.5' },
            { filename: 'Icon-App-1024x1024.png', idiom: 'ios-marketing', scale: '1x', size: '1024x1024' },
        ],
        info: { author: 'xcode', version: 1 },
    };

    fs.writeFileSync(path.join(iosAssetsPath, 'Contents.json'), JSON.stringify(contentsJson, null, 2));
    console.log('✓ 生成: AppIcon.appiconset/Contents.json');
} else {
    console.log('\n🍎 iOS 目录不存在，跳过 iOS 图标生成');
    console.log('   运行 "npx cap add ios" 后再执行此脚本');
}

// 生成 Web/PWA 图标
console.log('\n🌐 生成 Web 图标...\n');
generateIcon(512, path.join(projectRoot, 'public', 'icons', 'icon-512x512.png'));
generateIcon(192, path.join(projectRoot, 'public', 'icons', 'icon-192x192.png'));
generateIcon(180, path.join(projectRoot, 'public', 'apple-touch-icon.png'));
generateIcon(32, path.join(projectRoot, 'public', 'favicon-32x32.png'));
generateIcon(16, path.join(projectRoot, 'public', 'favicon-16x16.png'));

console.log('\n' + '=' .repeat(50));
console.log('\n✅ 图标生成完成！\n');
console.log('📋 后续步骤:');
console.log('   1. 运行 "npx cap sync android" 同步 Android 图标');
console.log('   2. 如需 iOS，运行 "npx cap add ios" 后重新执行此脚本');
console.log('   3. 重新构建 App 查看效果\n');
