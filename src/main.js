// src/main.js
import './style.css';
import * as THREE from 'three';
import liff from '@line/liff'; 

// ==========================================
// 1. 應用程式全域狀態
// ==========================================
let currentModule = 'DASHBOARD'; 
let cycle = 1;
const maxCycles = 3;
let phase = 'LOOKING'; 
let sopTimeLeft = 10; 
let stretchTimeLeft = 45; 
let chaserTimeLeft = 60; 
let chaserScore = 0;     
let breatheTimeLeft = 60; 
let breathPhase = 'INHALE'; 
let testPhase = 'LEFT_EYE'; 
let testTimeLeft = 15; 
let isResting = false;
let restTimeLeft = 0;

// ==========================================
// 2. 音效系統 (Web Audio API)
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playDingSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine'; 
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); 
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 1.5);
}
window.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
}, { once: true });

// ==========================================
// 3. UI 介面架構與 LIFF 初始化
// ==========================================
const dashboardUI = document.createElement('div');
dashboardUI.style.position = 'absolute';
dashboardUI.style.top = '0';
dashboardUI.style.left = '0';
dashboardUI.style.width = '100vw';
dashboardUI.style.height = '100vh';
dashboardUI.style.backgroundColor = '#0f141e';
dashboardUI.style.display = 'flex';
dashboardUI.style.flexDirection = 'column';
dashboardUI.style.alignItems = 'center';
dashboardUI.style.justifyContent = 'flex-start';
dashboardUI.style.padding = '50px 20px'; 
dashboardUI.style.fontFamily = 'sans-serif';
dashboardUI.style.zIndex = '10';
dashboardUI.style.overflowY = 'auto'; 
dashboardUI.style.boxSizing = 'border-box';
document.body.appendChild(dashboardUI);

const dashTitle = document.createElement('h1');
dashTitle.innerHTML = "<div style='font-size: 55px; margin-bottom: 15px;'>👁️</div>數位眼科與視覺復健中心";
dashTitle.style.color = '#fffdd0';
dashTitle.style.fontSize = '34px'; 
dashTitle.style.textAlign = 'center';
dashTitle.style.marginBottom = '20px';
dashTitle.style.letterSpacing = '1px';
dashboardUI.appendChild(dashTitle);

const dashSubtitle = document.createElement('p');
dashSubtitle.innerText = "系統載入中，請稍候..."; 
dashSubtitle.style.color = '#8b9bb4';
dashSubtitle.style.fontSize = '22px'; 
dashSubtitle.style.textAlign = 'center';
dashSubtitle.style.lineHeight = '1.5';
dashSubtitle.style.marginBottom = '35px';
dashSubtitle.style.wordBreak = 'keep-all'; 
dashboardUI.appendChild(dashSubtitle);

async function initializeLiff() {
    try {
        await liff.init({ liffId: '2010891900-u4t0FhJ6' });
        if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            dashSubtitle.innerText = `歡迎回來，${profile.displayName}！請選擇您的專屬放鬆模組`;
            dashSubtitle.style.color = '#00ffcc'; 
        } else {
            dashSubtitle.innerText = "請選擇您的專屬眼部放鬆與訓練模組 (未登入 LINE)";
        }
    } catch (err) {
        console.error('LIFF 初始化失敗:', err);
        dashSubtitle.innerText = "請選擇您的專屬眼部放鬆與訓練模組";
    }
}
initializeLiff();

// 衛教資訊互動視窗 (Modal)
const infoModal = document.createElement('div');
infoModal.style.position = 'absolute';
infoModal.style.top = '0';
infoModal.style.left = '0';
infoModal.style.width = '100vw';
infoModal.style.height = '100vh';
infoModal.style.backgroundColor = '#0f141e';
infoModal.style.zIndex = '50';
infoModal.style.overflowY = 'auto';
infoModal.style.display = 'none';
infoModal.style.padding = '20px';
infoModal.style.boxSizing = 'border-box';
infoModal.style.fontFamily = 'sans-serif';
document.body.appendChild(infoModal);

// 【修改】營養素頁面內容，套用統一的按鈕樣式
const nutrientPage = document.createElement('div');
nutrientPage.style.maxWidth = '800px';
nutrientPage.style.margin = '0 auto';
nutrientPage.style.paddingBottom = '50px';
nutrientPage.innerHTML = `
    <button id="close-info-btn" style="padding:12px 24px; background:#1a2233; color:#fffdd0; font-size:18px; font-weight:bold; border:1px solid #2a3a5a; border-radius:8px; margin-bottom:20px; cursor:pointer;">返回大廳</button>
    <h2 style="color:#fffdd0; font-size:28px; border-bottom:2px solid #00ffcc; padding-bottom:10px; margin-bottom:15px;">護眼營養素與眼睛構造對照表</h2>
    <p style="color:#8b9bb4; font-size:15px; line-height:1.6; margin-bottom:20px; background:#162b2b; padding:15px; border-radius:8px;">
        <strong style="color:#00ffcc;">閱讀重點｜</strong>營養素通常是維持組織正常功能或降低缺乏風險，不能取代眼科檢查與治療。Propolins 最適合定位在視網膜色素上皮（RPE），目前證據為人類細胞與動物模型。
    </p>
    <div style="overflow-x:auto; margin-bottom:30px;">
        <table style="width:100%; border-collapse:collapse; color:#fffdd0; font-size:15px; line-height:1.5;">
            <thead>
                <tr style="background:#1a2233; text-align:left;">
                    <th style="padding:12px; border:1px solid #2a3a5a;">營養素／成分</th>
                    <th style="padding:12px; border:1px solid #2a3a5a;">主要相關部位</th>
                    <th style="padding:12px; border:1px solid #2a3a5a;">作用與目前證據</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding:12px; border:1px solid #2a3a5a; color:#00ffcc; font-weight:bold;">葉黃素、玉米黃素</td>
                    <td style="padding:12px; border:1px solid #2a3a5a;">黃斑部、中央凹</td>
                    <td style="padding:12px; border:1px solid #2a3a5a;">構成黃斑色素，與中央視力、辨色有關；最直接對應黃斑部的營養素。</td>
                </tr>
                <tr style="background:#162b2b;">
                    <td style="padding:12px; border:1px solid #2a3a5a; color:#00ffcc; font-weight:bold;">Propolins (尤其G)</td>
                    <td style="padding:12px; border:1px solid #2a3a5a;">視網膜色素上皮RPE；外層視網膜界面</td>
                    <td style="padding:12px; border:1px solid #2a3a5a;">細胞實驗顯示可提高損傷下存活；乾性AMD大鼠模型中，ERG c-wave部分恢復表示RPE功能改善 (細胞+動物前臨床證據)。</td>
                </tr>
                <tr>
                    <td style="padding:12px; border:1px solid #2a3a5a; color:#00ffcc; font-weight:bold;">維生素A／β-胡蘿蔔素</td>
                    <td style="padding:12px; border:1px solid #2a3a5a;">視網膜桿狀細胞；角結膜</td>
                    <td style="padding:12px; border:1px solid #2a3a5a;">維持眼表上皮；缺乏可能夜盲或乾眼。</td>
                </tr>
                <tr>
                    <td style="padding:12px; border:1px solid #2a3a5a; color:#00ffcc; font-weight:bold;">DHA & Omega-3</td>
                    <td style="padding:12px; border:1px solid #2a3a5a;">感光細胞膜 / 淚膜、眼表</td>
                    <td style="padding:12px; border:1px solid #2a3a5a;">具生理結構角色；可能影響發炎與淚膜油脂層。</td>
                </tr>
                <tr>
                    <td style="padding:12px; border:1px solid #2a3a5a; color:#00ffcc; font-weight:bold;">維生素C、E、鋅、銅</td>
                    <td style="padding:12px; border:1px solid #2a3a5a;">水晶體、黃斑部</td>
                    <td style="padding:12px; border:1px solid #2a3a5a;">抗氧化營養素，組成AREDS2可延緩特定AMD惡化。不適合未經診斷自行長期高劑量服用。</td>
                </tr>
                <tr>
                    <td style="padding:12px; border:1px solid #2a3a5a; color:#00ffcc; font-weight:bold;">維生素B1、B12、葉酸</td>
                    <td style="padding:12px; border:1px solid #2a3a5a;">視神經</td>
                    <td style="padding:12px; border:1px solid #2a3a5a;">嚴重缺乏可能造成營養性視神經病變；主要為避免缺乏。</td>
                </tr>
            </tbody>
        </table>
    </div>
    
    <h3 style="color:#fffdd0; margin-bottom:10px;">⚠️ 補充品使用注意</h3>
    <ul style="color:#8b9bb4; font-size:15px; line-height:1.8; margin-bottom:30px; padding-left:20px;">
        <li><strong style="color:#fffdd0;">不可自行點眼：</strong>專利式(II)是研究用眼科製劑，市售口服蜂膠絕不可自行滴入眼睛。</li>
        <li><strong style="color:#fffdd0;">證據界線：</strong>Propolins 支持的是「受損RPE的細胞保護」，目前為細胞與動物前臨床證據，不能據此宣稱預防或治療人體AMD。</li>
        <li><strong style="color:#fffdd0;">AREDS2：</strong>只適用眼科醫師判定的特定AMD；健康人或單純疲勞者不應自行套用高劑量配方。</li>
        <li><strong style="color:#fffdd0;">就醫警訊：</strong>出現視野扭曲、單眼黑影/閃光、視力下降等，應盡快就醫，不應只靠補充品觀察。</li>
    </ul>

    <div style="text-align:center; margin-top:40px;">
        <button id="btn-to-rpe" style="padding:15px 30px; background:#00ffcc; color:#0f141e; border:none; border-radius:30px; font-size:20px; font-weight:bold; cursor:pointer; box-shadow:0 4px 15px rgba(0,255,204,0.4);">👉 RPE 為什麼重要？</button>
    </div>
`;
infoModal.appendChild(nutrientPage);

// 【修改】RPE 說明頁面內容，套用統一的按鈕樣式
const rpePage = document.createElement('div');
rpePage.style.maxWidth = '800px';
rpePage.style.margin = '0 auto';
rpePage.style.paddingBottom = '50px';
rpePage.style.display = 'none'; 
rpePage.innerHTML = `
    <button id="back-to-nutrient-btn" style="padding:12px 24px; background:#1a2233; color:#fffdd0; font-size:18px; font-weight:bold; border:1px solid #2a3a5a; border-radius:8px; margin-bottom:20px; cursor:pointer;">🔙 返回護眼營養素</button>
    <h2 style="color:#fffdd0; font-size:28px; border-bottom:2px solid #00ffcc; padding-bottom:10px; margin-bottom:20px;">🏭 垃圾處理廠與清潔工：認識 RPE</h2>
    
    <div style="color:#8b9bb4; font-size:16px; line-height:1.8;">
        <p style="margin-bottom:15px;">我們可以把眼底的「視網膜色素上皮細胞 (RPE)」想像成眼底的<strong style="color:#fffdd0;">垃圾處理廠</strong>，而上方的感光細胞則是負責看東西的員工。</p>
        
        <h3 style="color:#00ffcc; margin-top:25px; margin-bottom:10px;">一、什麼是脂褐質？它是怎麼形成的？</h3>
        <ul style="padding-left:20px; margin-bottom:20px;">
            <li><strong>員工天天產生垃圾：</strong>感光細胞每天工作會消耗能量，並脫落大量老舊廢棄物。</li>
            <li><strong>清潔工天天回收：</strong>健康的 RPE 每天會把垃圾吞進去，用溶小體酵素徹底分解化為養分。</li>
            <li><strong>變成陳年鐵鏽：</strong>若受藍光傷害或老化，處理廠酵素變弱。那些卡在肚子裡無法消化的油垢，經光線照射後生鏽變質，就形成了永遠無法清除的<strong style="color:#ff6b6b;">「脂褐質」</strong>。</li>
        </ul>

        <h3 style="color:#00ffcc; margin-top:25px; margin-bottom:10px;">二、健康的 RPE（好工廠）如何保護眼睛？</h3>
        <ul style="padding-left:20px; margin-bottom:20px;">
            <li><strong>天天清空垃圾：</strong>不讓垃圾有機會生鏽變成脂褐質。</li>
            <li><strong>自帶超強防護罩：</strong>利用天然防曬劑(黑色素與抗氧化酶)擋掉有害光線。</li>
            <li><strong>精準控管原料：</strong>順暢處理維生素 A，不讓其亂結塊。</li>
        </ul>

        <h3 style="color:#ff6b6b; margin-top:25px; margin-bottom:10px;">三、不健康的 RPE（爛工廠）帶來的災難</h3>
        <ul style="padding-left:20px; margin-bottom:25px;">
            <li><strong style="color:#fffdd0;">1. 吃再多營養也吸收不了：</strong>運輸卡車停擺，就算吃再多高檔葉黃素，不健康的工廠也無法吸收利用。</li>
            <li><strong style="color:#fffdd0;">2. 眼底長斑堆垃圾：</strong>肚子被脂褐質塞爆後，把垃圾往地基亂倒，形成「隱形斑(Drusen)」，切斷氧氣與營養。</li>
            <li><strong style="color:#fffdd0;">3. 眼睛結構大毀滅：</strong>防護牆破裂，眼底亂長脆弱的新生血管（濕性病變）；最終員工集體餓死（地圖狀萎縮），導致視野中央出現黑洞失明。</li>
        </ul>
        
        <div style="background:#162b2b; padding:20px; border-radius:10px; text-align:center; border: 1px solid #00ffcc;">
            <p style="color:#fffdd0; font-size:18px; font-weight:bold; margin:0;">💡 總結</p>
            <p style="color:#00ffcc; font-size:18px; margin-top:10px; margin-bottom:0;">「健康的 RPE 能幫你消滅垃圾；<br>不健康的 RPE 會讓垃圾（脂褐質）堆成高山，最後把你的視力連根拔起。」</p>
        </div>
    </div>
`;
infoModal.appendChild(rpePage);

// 模組切換邏輯
document.getElementById('btn-to-rpe').onclick = () => {
    nutrientPage.style.display = 'none';
    rpePage.style.display = 'block';
    infoModal.scrollTo(0,0);
};
document.getElementById('back-to-nutrient-btn').onclick = () => {
    rpePage.style.display = 'none';
    nutrientPage.style.display = 'block';
    infoModal.scrollTo(0,0);
};
document.getElementById('close-info-btn').onclick = () => {
    infoModal.style.display = 'none';
    dashboardUI.style.display = 'flex';
};

// ==========================================
// 大廳選單配置
// ==========================================
const menuGrid = document.createElement('div');
menuGrid.style.display = 'grid';
menuGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))'; 
menuGrid.style.gap = '20px';
menuGrid.style.width = '100%';
menuGrid.style.maxWidth = '800px';
dashboardUI.appendChild(menuGrid);

// 【修改】為 createModuleCard 加入 color 參數，控制各模組外框與光暈
function createModuleCard(title, desc, onClick, color) {
    const card = document.createElement('div');
    card.style.backgroundColor = '#1a2233'; 
    card.style.border = `1px solid ${color}`;
    card.style.borderRadius = '12px';
    card.style.padding = '24px 20px'; 
    card.style.cursor = 'pointer';
    card.style.transition = 'all 0.2s ease';
    card.style.boxShadow = 'none';

    card.onmouseover = () => {
        card.style.transform = 'translateY(-3px)';
        // 動態生成對應顏色的光暈
        card.style.boxShadow = `0 0 15px ${color}66`;
    };
    card.onmouseout = () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
    };

    const h3 = document.createElement('h3');
    h3.innerText = title;
    h3.style.color = '#fffdd0';
    h3.style.fontSize = '22px'; 
    h3.style.marginBottom = '12px';
    card.appendChild(h3);

    const p = document.createElement('p');
    p.innerText = desc;
    p.style.color = '#8b9bb4';
    p.style.fontSize = '16px'; 
    p.style.lineHeight = '1.6';
    card.appendChild(p);
    card.onclick = onClick;
    return card;
}

// 【修改】將衛教區塊融入網格，並分配 7 種獨立的專屬顏色
menuGrid.appendChild(createModuleCard("📖 護眼常見營養素與 RPE 百科", "點擊了解護眼成分作用部位，以及視網膜垃圾處理廠 (RPE) 的重要性", () => {
    dashboardUI.style.display = 'none';
    infoModal.style.display = 'block';
    nutrientPage.style.display = 'block';
    rpePage.style.display = 'none';
    infoModal.scrollTo(0,0);
}, '#00ffcc')); // 螢光青綠

menuGrid.appendChild(createModuleCard("🚀 45秒快速舒緩", "結合遠眺聚焦、隨機白球衝擊與深層閉眼潤滑。", () => startTraining('sop'), '#ff9900')); // 暖橘色

menuGrid.appendChild(createModuleCard("🔄 動態 3D 眼肌伸展", "引導眼球進行 ∞ 字型極限軌跡，並結合 Z 軸遠近對焦。", () => startTraining('stretch'), '#00aaff')); // 亮藍色

menuGrid.appendChild(createModuleCard("🎮 睫狀肌深空追光", "【放鬆遊戲】死盯流星飛向深空，強迫睫狀肌徹底看遠放鬆。", () => startTraining('chaser'), '#ff55ff')); // 螢光粉紅

menuGrid.appendChild(createModuleCard("🌌 星雲散焦與神經放鬆", "【深度冥想】釋放隧道視覺，同步 3D 粒子星雲進行共振呼吸。", () => startTraining('breathe'), '#b026ff')); // 冥想深紫

menuGrid.appendChild(createModuleCard("🔍 黃斑部自我檢測", "經典阿姆斯勒方格表數位化，快篩視網膜病變風險。", () => startTraining('amsler'), '#ffff00')); // 警告鮮黃

menuGrid.appendChild(createModuleCard("👁️ 散光軸向自我檢測", "放射鐘測試。檢測是否因散光未矯正而導致嚴重疲勞。", () => startTraining('astigmatism'), '#ff3333')); // 注意亮紅


const trainingUI = document.createElement('div');
trainingUI.style.position = 'absolute';
trainingUI.style.left = '50%';
trainingUI.style.top = '70%'; 
trainingUI.style.transform = 'translate(-50%, -50%)';
trainingUI.style.width = '90%'; 
trainingUI.style.textAlign = 'center';
trainingUI.style.pointerEvents = 'none';
trainingUI.style.transition = 'top 1.2s cubic-bezier(0.25, 1, 0.5, 1)';
trainingUI.style.textShadow = '0px 4px 15px rgba(0, 0, 0, 0.9), 0px 0px 5px rgba(0, 0, 0, 1)';
trainingUI.style.display = 'none'; 
document.body.appendChild(trainingUI);

const titleUI = document.createElement('div');
titleUI.style.color = '#fffdd0';
titleUI.style.fontFamily = 'sans-serif';
titleUI.style.fontSize = '26px'; 
titleUI.style.fontWeight = 'bold';
titleUI.style.letterSpacing = '1px';
titleUI.style.marginBottom = '15px';
titleUI.style.lineHeight = '1.4';
trainingUI.appendChild(titleUI);

const timerUI = document.createElement('div');
timerUI.style.color = '#00ffcc';
timerUI.style.fontFamily = 'monospace';
timerUI.style.fontSize = '24px';
trainingUI.appendChild(timerUI);

const backBtn = document.createElement('button');
backBtn.innerText = "返回大廳";
backBtn.style.position = 'absolute';
backBtn.style.top = '20px';
backBtn.style.left = '20px';
backBtn.style.padding = '12px 24px'; 
backBtn.style.backgroundColor = '#1a2233';
backBtn.style.color = '#fffdd0';
backBtn.style.fontSize = '18px'; 
backBtn.style.fontWeight = 'bold';
backBtn.style.border = '1px solid #2a3a5a';
backBtn.style.borderRadius = '8px';
backBtn.style.cursor = 'pointer';
backBtn.style.display = 'none';
backBtn.style.zIndex = '20';
backBtn.onclick = returnToDashboard;
document.body.appendChild(backBtn);

// ==========================================
// 4. 建立 Three.js 場景與模組物件
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f141e);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const ambientLight = new THREE.AmbientLight(0xfffdd0, 0.6);
scene.add(ambientLight);

const sopGroup = new THREE.Group();
sopGroup.position.y = 12; 
const sopGeo = new THREE.SphereGeometry(8, 32, 32);
const sopMat = new THREE.MeshStandardMaterial({ color: 0x6b8e23, emissive: 0x2e4b1c, wireframe: true, transparent: true });
const focusTarget = new THREE.Mesh(sopGeo, sopMat);
const coreGeo = new THREE.SphereGeometry(0.8, 16, 16);
const coreMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true });
focusTarget.add(new THREE.Mesh(coreGeo, coreMat));
sopGroup.add(focusTarget);
scene.add(sopGroup);

const stretchGroup = new THREE.Group();
const stretchOrb = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff9900 }));
stretchOrb.add(new THREE.PointLight(0xffaa00, 2.5, 60));
stretchGroup.add(stretchOrb);
scene.add(stretchGroup);

const amslerGroup = new THREE.Group();
const gridHelper = new THREE.GridHelper(30, 30, 0x557799, 0x445566);
gridHelper.rotation.x = Math.PI / 2; gridHelper.position.z = -15; 
amslerGroup.add(gridHelper);
const centerDot = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
centerDot.position.z = -14.9; 
amslerGroup.add(centerDot);
scene.add(amslerGroup);

const astigGroup = new THREE.Group();
for (let i = 0; i < 12; i++) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(25, 0.3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    line.rotation.z = (i * Math.PI) / 12;
    astigGroup.add(line);
}
const astigCenterDot = new THREE.Mesh(new THREE.CircleGeometry(0.8, 32), new THREE.MeshBasicMaterial({ color: 0xff3333 }));
astigCenterDot.position.z = 0.1; 
astigGroup.add(astigCenterDot);
astigGroup.position.z = -25; 
scene.add(astigGroup);

const breatheGroup = new THREE.Group();
const particleCount = 2000;
const particlesGeo = new THREE.BufferGeometry();
const posArray = new Float32Array(particleCount * 3);
for(let i = 0; i < particleCount * 3; i++) { posArray[i] = (Math.random() - 0.5) * 60; }
particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMat = new THREE.PointsMaterial({ size: 0.15, color: 0x00ffcc, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
const particleSystem = new THREE.Points(particlesGeo, particlesMat);
breatheGroup.add(particleSystem);
breatheGroup.position.z = -20;
scene.add(breatheGroup);

const chaserGroup = new THREE.Group();
const chaserOrb = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true }));
chaserOrb.add(new THREE.PointLight(0xffd700, 2.5, 80)); 
chaserGroup.add(chaserOrb);
scene.add(chaserGroup);

function resetChaserOrb() {
    chaserOrb.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 15, -10);
    chaserOrb.scale.set(1, 1, 1);
    chaserOrb.material.opacity = 1;
}

const allModules = [sopGroup, stretchGroup, amslerGroup, astigGroup, breatheGroup, chaserGroup];
allModules.forEach(m => m.visible = false);
const stimulusBalls = [];

function spawnStimulusBall() {
    const ballGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const ballMat = new THREE.MeshBasicMaterial({ color: 0xf5f5dc, transparent: true, opacity: 0.8, depthWrite: false });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, -70);
    sopGroup.add(ball); 
    stimulusBalls.push(ball);
}

// ==========================================
// 5. 控制邏輯與切換函數
// ==========================================
function startTraining(type) {
    currentModule = type;
    isResting = false;
    restTimeLeft = 0;
    
    dashboardUI.style.display = 'none';
    trainingUI.style.display = 'block';
    backBtn.style.display = 'block';

    allModules.forEach(m => m.visible = false);

    if (type === 'sop') {
        sopGroup.visible = true; cycle = 1; phase = 'LOOKING'; sopTimeLeft = 10;
        sopMat.opacity = 1; coreMat.opacity = 1;
    } else if (type === 'stretch') {
        stretchGroup.visible = true; stretchTimeLeft = 45; stretchOrb.position.set(0, 0, -30);
    } else if (type === 'chaser') {
        chaserGroup.visible = true; breatheGroup.visible = true; chaserTimeLeft = 60; chaserScore = 0; resetChaserOrb();
    } else if (type === 'breathe') {
        breatheGroup.visible = true; breatheTimeLeft = 60; breathPhase = 'INHALE';
    } else if (type === 'amsler' || type === 'astigmatism') {
        if (type === 'amsler') amslerGroup.visible = true;
        if (type === 'astigmatism') astigGroup.visible = true;
        testPhase = 'LEFT_EYE'; testTimeLeft = 15;
    }
    updateTrainingUI();
}

function returnToDashboard() {
    currentModule = 'DASHBOARD';
    isResting = false;
    dashboardUI.style.display = 'flex';
    trainingUI.style.display = 'none';
    backBtn.style.display = 'none';
    allModules.forEach(m => m.visible = false);
    stimulusBalls.forEach(ball => {
        if(ball.parent) ball.parent.remove(ball);
    });
    stimulusBalls.length = 0;
}

function updateTrainingUI() {
    if (currentModule === 'sop') {
        if (phase === 'COMPLETED') { 
            trainingUI.style.top = '35%'; 
            titleUI.innerText = "🎉 3 回合深層放鬆完成！"; 
            timerUI.innerText = ""; 
        } 
        else if (phase === 'LOOKING') { 
            trainingUI.style.top = '70%'; 
            titleUI.innerText = `(第 ${cycle}/${maxCycles} 回合)\n請柔和注視中心橘點`; 
            timerUI.innerText = `剩餘 ${sopTimeLeft} 秒`; 
        } 
        else if (phase === 'CLOSING') { 
            trainingUI.style.top = '70%'; 
            titleUI.innerText = "請用力閉上雙眼，徹底放鬆"; 
            timerUI.innerText = `剩餘 ${sopTimeLeft} 秒`; 
        }
    } else if (currentModule === 'stretch') {
        if (stretchTimeLeft > 0) { 
            trainingUI.style.top = '80%'; 
            titleUI.innerText = "保持頭部靜止\n跟隨光球移動伸展眼肌"; 
            timerUI.innerText = `剩餘 ${stretchTimeLeft} 秒`; 
        } 
        else if (isResting) {
            trainingUI.style.top = '50%'; 
            titleUI.innerText = "請閉眼休息5秒鐘"; 
            timerUI.innerText = `休息 ${restTimeLeft} 秒`;
        }
        else { 
            trainingUI.style.top = '50%'; 
            titleUI.innerText = "🎉 眼肌與焦距重訓完成！"; 
            timerUI.innerText = ""; 
        }
    } else if (currentModule === 'chaser') {
        if (chaserTimeLeft > 0) {
            trainingUI.style.top = '80%'; 
            titleUI.innerHTML = `【睫狀肌深空追光】<br><span style='font-size:16px; color:#8b9bb4;'>死盯流星飛向最深處直到消失<br>(已追蹤: ${chaserScore} 顆)</span>`; 
            timerUI.innerText = `遊戲剩餘：${chaserTimeLeft} 秒`;
        } 
        else if (isResting) {
            trainingUI.style.top = '50%'; 
            titleUI.innerText = "請閉眼休息5秒鐘"; 
            timerUI.innerText = `休息 ${restTimeLeft} 秒`;
        }
        else {
            trainingUI.style.top = '50%'; 
            titleUI.innerHTML = `🎮 遊戲結束！<br>您成功追蹤了 <span style="color:#00ffcc;">${chaserScore}</span> 顆深空流星`; 
            timerUI.innerText = "睫狀肌已獲得充分的遠眺放鬆";
        }
    } else if (currentModule === 'breathe') {
        if (breatheTimeLeft > 0) {
            trainingUI.style.top = '85%'; 
            const actionText = breathPhase === 'INHALE' ? "跟隨星雲【緩慢吸氣】" : "跟隨星雲【徹底吐氣】";
            titleUI.innerHTML = `<span style="font-size: 28px;">${actionText}</span><br><span style='font-size:16px; color:#8b9bb4;'>(請不要對焦任何星星，放寬視野)</span>`; 
            timerUI.innerText = `深度放鬆中：${breatheTimeLeft} 秒`;
        }
        else if (isResting) {
            trainingUI.style.top = '50%'; 
            titleUI.innerText = "請閉眼休息5秒鐘"; 
            timerUI.innerText = `休息 ${restTimeLeft} 秒`;
        }
        else {
            trainingUI.style.top = '50%'; 
            titleUI.innerText = "🌌 視覺神經與自律神經已深度重置"; 
            timerUI.innerText = "現在您的眼睛處於最佳狀態";
        }
    } else if (currentModule === 'amsler' || currentModule === 'astigmatism') {
        if (testPhase === 'COMPLETED') {
            trainingUI.style.top = '50%'; titleUI.innerText = "檢測完成！若有異常請檢查視力與散光度數"; timerUI.innerText = "點擊左上角返回大廳";
        } else {
            trainingUI.style.top = '80%'; const eyeText = testPhase === 'LEFT_EYE' ? "左眼" : "右眼"; const coverText = testPhase === 'LEFT_EYE' ? "右眼" : "左眼";
            if(currentModule === 'amsler') { titleUI.innerHTML = `【檢測${eyeText}】請遮住${coverText}，死盯中心白點<br><span style='font-size:16px; color:#8b9bb4;'>(觀察周圍網格是否扭曲或有黑影)</span>`; } 
            else { titleUI.innerHTML = `【檢測${eyeText}】請遮住${coverText}，注視中心紅點<br><span style='font-size:16px; color:#8b9bb4;'>(觀察線條是否有些特別黑粗、或模糊發淡？)</span>`; }
            timerUI.innerText = `檢測中：${testTimeLeft} 秒`;
        }
    }
}

// ==========================================
// 6. 核心渲染動畫
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    if (currentModule === 'DASHBOARD') { renderer.render(new THREE.Scene(), camera); return; }
    const time = Date.now(); const timeDelta = time * 0.0015;

    if (currentModule === 'sop' && phase !== 'COMPLETED') {
        focusTarget.rotation.x += 0.002; focusTarget.rotation.y += 0.003; 
        focusTarget.position.z = -50; 
        const scale = 1 + Math.cos(timeDelta) * 0.25; 
        focusTarget.scale.set(scale, scale, scale);

        const targetOpacity = (phase === 'CLOSING') ? 0.05 : 1.0;
        sopMat.opacity += (targetOpacity - sopMat.opacity) * 0.05; coreMat.opacity += (targetOpacity - coreMat.opacity) * 0.05;
        
        for (let i = stimulusBalls.length - 1; i >= 0; i--) {
            const ball = stimulusBalls[i]; ball.position.z += 1.5;
            if (ball.position.z > -10) { ball.position.z += 3.0; ball.scale.addScalar(0.8); ball.material.opacity = 1.0; ball.material.color.setHex(0xffffff); } 
            else { ball.scale.addScalar(0.015); }
            if (ball.position.z > camera.position.z) { 
                if(ball.parent) ball.parent.remove(ball); 
                ball.geometry.dispose(); ball.material.dispose(); stimulusBalls.splice(i, 1); 
            }
        }
    }

    if (currentModule === 'stretch' && stretchTimeLeft > 0) {
        const speed = time * 0.0012; 
        stretchOrb.scale.setScalar(1 + Math.cos(speed * 3) * 0.1);
        
        const isMobile = window.innerWidth < 600;
        const xAmplitude = isMobile ? 8.5 : 18; 
        const yAmplitude = isMobile ? 12 : 8; 
        const zCenter = -30;
        const zAmplitude = 20;
        
        stretchOrb.position.set(Math.sin(speed) * xAmplitude, Math.sin(speed * 2) * yAmplitude, zCenter + Math.sin(speed * 0.5) * zAmplitude);
    }
    
    if (currentModule === 'breathe' || currentModule === 'chaser') {
        particleSystem.rotation.y += 0.0005; particleSystem.rotation.z += 0.0002;
    }

    if (currentModule === 'chaser' && chaserTimeLeft > 0) {
        chaserOrb.position.z -= 0.6; 
        if (chaserOrb.position.z < -120) { chaserScore++; playDingSound(); resetChaserOrb(); } 
        else {
            const progress = (chaserOrb.position.z + 10) / -110; 
            const currentScale = Math.max(0, 1 - progress * 0.9); chaserOrb.scale.set(currentScale, currentScale, currentScale);
            chaserOrb.material.opacity = 1 - Math.pow(progress, 3); 
        }
    }

    if (currentModule === 'breathe' && breatheTimeLeft > 0) {
        const breathCycle = Math.sin((time % 10000) / 10000 * Math.PI * 2);
        const currentScale = 1.05 + breathCycle * 0.25; particleSystem.scale.set(currentScale, currentScale, currentScale);
        const hue = 0.5 + breathCycle * 0.1; const lightness = 0.4 + breathCycle * 0.2; particlesMat.color.setHSL(hue, 0.8, lightness);
    }
    renderer.render(scene, camera);
}
animate();

// ==========================================
// 7. 狀態機與倒數計時器
// ==========================================
setInterval(() => {
    if (currentModule === 'DASHBOARD') return;

    if ((currentModule === 'stretch' || currentModule === 'chaser' || currentModule === 'breathe') && isResting) {
        restTimeLeft--;
        if (restTimeLeft <= 0) {
            isResting = false; 
            playDingSound();   
        }
        updateTrainingUI();
        return; 
    }

    if (currentModule === 'sop') {
        if (phase === 'COMPLETED') return;
        sopTimeLeft--;
        if (phase === 'LOOKING' && sopTimeLeft === 3) spawnStimulusBall();
        if (sopTimeLeft <= 0) {
            if (phase === 'LOOKING') { phase = 'CLOSING'; sopTimeLeft = 5; } 
            else if (phase === 'CLOSING') { cycle++; if (cycle > maxCycles) { phase = 'COMPLETED'; playDingSound(); } else { phase = 'LOOKING'; sopTimeLeft = 10; playDingSound(); } }
        }
    } 
    else if (currentModule === 'stretch') { 
        if (stretchTimeLeft <= 0) return; 
        stretchTimeLeft--; 
        if (stretchTimeLeft <= 0) {
            isResting = true;
            restTimeLeft = 5;
            playDingSound(); 
        }
    }
    else if (currentModule === 'chaser') { 
        if (chaserTimeLeft <= 0) return; 
        chaserTimeLeft--; 
        if (chaserTimeLeft <= 0) {
            isResting = true;
            restTimeLeft = 5;
            playDingSound(); 
        }
    }
    else if (currentModule === 'breathe') {
        if (breatheTimeLeft <= 0) return; 
        breatheTimeLeft--;
        if (breatheTimeLeft > 0) {
            if (breatheTimeLeft % 10 === 5) { breathPhase = 'INHALE'; playDingSound(); } 
            else if (breatheTimeLeft % 10 === 0) { breathPhase = 'EXHALE'; playDingSound(); }
        } else {
            isResting = true;
            restTimeLeft = 5;
            playDingSound(); 
        }
    }
    else if (currentModule === 'amsler' || currentModule === 'astigmatism') {
        if (testPhase === 'COMPLETED') return; testTimeLeft--;
        if (testTimeLeft <= 0) {
            if (testPhase === 'LEFT_EYE') { testPhase = 'RIGHT_EYE'; testTimeLeft = 15; playDingSound(); } 
            else if (testPhase === 'RIGHT_EYE') { testPhase = 'COMPLETED'; playDingSound(); }
        }
    }
    updateTrainingUI();
}, 1000);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});