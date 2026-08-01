// src/main.js
import './style.css';
import * as THREE from 'three';
import liff from '@line/liff'; 
import { createClient } from '@supabase/supabase-js';

// ==========================================
// 1. 應用程式全域狀態與雲端資料庫設定
// ==========================================
const supabaseUrl = 'https://bowzkrdxjfxwuxkvvlnh.supabase.co';
const supabaseKey = 'sb_publishable_JyPNp0UKUlSeNKMM-okN4Q_TAHuCSMT';
const supabase = createClient(supabaseUrl, supabaseKey);

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

let lineUid = '未登入';
let lineName = '訪客';

// ==========================================
// 2. 雲端大腦 (Supabase) 紀錄模組
// ==========================================
async function logTraining(moduleName, durationSec) {
    if (lineUid === '未登入') return; 
    try {
        const { error } = await supabase
            .from('training_logs')
            .insert([{
                line_uid: lineUid,
                line_name: lineName,
                module_name: moduleName,
                duration: durationSec
            }]);
        if (error) {
            console.error('❌ Supabase 雲端寫入失敗:', error);
        } else {
            console.log(`✅ [${moduleName}] 訓練紀錄已成功寫入雲端大腦！`);
        }
    } catch (err) {
        console.error('❌ 寫入過程發生系統錯誤:', err);
    }
}

// ==========================================
// 3. 音效系統 (Web Audio API) & 背景音樂
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

// 【新增】背景音樂播放器 (game1.mp3)
const bgmPlayer = new Audio('./game1.mp3');
bgmPlayer.loop = true; 

function playBGM() {
    bgmPlayer.volume = 0;
    const playPromise = bgmPlayer.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            let vol = 0;
            const fade = setInterval(() => {
                if (vol < 0.6) { 
                    vol += 0.05;
                    bgmPlayer.volume = Math.min(vol, 0.6);
                } else {
                    clearInterval(fade);
                }
            }, 100);
        }).catch(error => {
            console.log("BGM play prevented by browser:", error);
        });
    }
}

function stopBGM() {
    let vol = bgmPlayer.volume;
    const fade = setInterval(() => {
        if (vol > 0.05) {
            vol -= 0.1;
            bgmPlayer.volume = Math.max(vol, 0);
        } else {
            clearInterval(fade);
            bgmPlayer.pause();
            bgmPlayer.currentTime = 0;
        }
    }, 100);
}

// ==========================================
// 4. UI 介面架構與 LIFF 初始化
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
dashboardUI.style.padding = '40px 20px'; 
dashboardUI.style.fontFamily = 'sans-serif';
dashboardUI.style.zIndex = '10';
dashboardUI.style.overflowY = 'auto'; 
dashboardUI.style.boxSizing = 'border-box';
document.body.appendChild(dashboardUI);

const dashTitle = document.createElement('h1');
dashTitle.innerHTML = "<div style='font-size: 55px; margin-bottom: 10px;'>👁️</div>數位眼科與視覺復健中心";
dashTitle.style.color = '#fffdd0';
dashTitle.style.fontSize = '32px'; 
dashTitle.style.textAlign = 'center';
dashTitle.style.marginBottom = '15px';
dashTitle.style.letterSpacing = '1px';
dashboardUI.appendChild(dashTitle);

const dashSubtitle = document.createElement('p');
dashSubtitle.innerText = "系統載入中，請稍候..."; 
dashSubtitle.style.color = '#8b9bb4';
dashSubtitle.style.fontSize = '20px'; 
dashSubtitle.style.textAlign = 'center';
dashSubtitle.style.lineHeight = '1.5';
dashSubtitle.style.marginBottom = '30px';
dashSubtitle.style.wordBreak = 'keep-all'; 
dashboardUI.appendChild(dashSubtitle);

async function initializeLiff() {
    try {
        await liff.init({ liffId: '2010891900-u4t0FhJ6' });
        if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            lineUid = profile.userId;
            lineName = profile.displayName;
            dashSubtitle.innerText = `歡迎回來，${profile.displayName}！請選擇您的專屬放鬆模組`;
            dashSubtitle.style.color = '#00ffcc'; 
        } else {
            dashSubtitle.innerHTML = `請選擇您的專屬眼部放鬆與訓練模組<br>
            <button id="liff-login-btn" style="margin-top:15px; padding:10px 24px; background:#06C755; color:#fff; border:none; border-radius:30px; font-size:18px; font-weight:bold; cursor:pointer; box-shadow:0 4px 10px rgba(6,199,85,0.3);">🟢 使用 LINE 一鍵登入</button>`;
            document.getElementById('liff-login-btn').onclick = () => {
                liff.login({ redirectUri: window.location.href });
            };
        }
    } catch (err) {
        console.error('LIFF 初始化失敗:', err);
        dashSubtitle.innerText = "請選擇您的專屬眼部放鬆與訓練模組";
    }
}
initializeLiff();

const contentContainer = document.createElement('div');
contentContainer.style.width = '100%';
contentContainer.style.maxWidth = '800px';
contentContainer.style.display = 'flex';
contentContainer.style.flexDirection = 'column';
contentContainer.style.gap = '20px'; 
contentContainer.style.marginBottom = '40px';
dashboardUI.appendChild(contentContainer);

// ==========================================
// 模組一：衛教資訊與遊戲原理互動視窗 (Modal)
// ==========================================
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

// 【營養素頁面】 (完整回復原本的 HTML 內容)
const nutrientPage = document.createElement('div');
nutrientPage.style.maxWidth = '800px';
nutrientPage.style.margin = '0 auto';
nutrientPage.style.paddingBottom = '50px';
nutrientPage.innerHTML = `
    <button id="close-info-btn" style="padding:12px 24px; background:#1a2233; color:#fffdd0; border:1px solid #2a3a5a; border-radius:8px; margin-bottom:20px; cursor:pointer; font-size:18px; font-weight:bold;">返回大廳</button>
    <h2 style="color:#fffdd0; font-size:28px; border-bottom:2px solid #00ffcc; padding-bottom:10px; margin-bottom:15px;">護眼營養素與眼睛構造對照表</h2>
    <p style="color:#8b9bb4; font-size:18px; line-height:1.6; margin-bottom:20px; background:#162b2b; padding:15px; border-radius:8px;">
        <strong style="color:#00ffcc;">閱讀重點｜</strong>營養素通常是維持組織正常功能或降低缺乏風險，不能取代眼科檢查與治療。Propolins 最適合定位在視網膜色素上皮（RPE），目前證據為人類細胞與動物模型，尚非人體臨床療效。
    </p>
    <div style="overflow-x:auto; margin-bottom:30px;">
        <table style="width:100%; border-collapse:collapse; color:#fffdd0; font-size:17px; line-height:1.6;">
            <thead>
                <tr style="background:#1a2233; text-align:left;">
                    <th style="padding:14px; border:1px solid #2a3a5a;">營養素／成分</th>
                    <th style="padding:14px; border:1px solid #2a3a5a;">主要相關部位</th>
                    <th style="padding:14px; border:1px solid #2a3a5a;">作用與目前證據</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding:14px; border:1px solid #2a3a5a; color:#00ffcc; font-weight:bold;">葉黃素、玉米黃素</td>
                    <td style="padding:14px; border:1px solid #2a3a5a;">黃斑部、中央凹</td>
                    <td style="padding:14px; border:1px solid #2a3a5a;">構成黃斑色素，與中央視力、辨色有關；最直接對應黃斑部的營養素。</td>
                </tr>
                <tr style="background:#162b2b;">
                    <td style="padding:14px; border:1px solid #2a3a5a; color:#00ffcc; font-weight:bold;">Propolins (尤其G)</td>
                    <td style="padding:14px; border:1px solid #2a3a5a;">視網膜色素上皮RPE；外層視網膜界面</td>
                    <td style="padding:14px; border:1px solid #2a3a5a;">細胞實驗顯示可提高損傷下存活；乾性AMD大鼠模型中，ERG c-wave部分恢復表示RPE功能改善。</td>
                </tr>
                <tr>
                    <td style="padding:14px; border:1px solid #2a3a5a; color:#00ffcc; font-weight:bold;">維生素A／β-胡蘿蔔素</td>
                    <td style="padding:14px; border:1px solid #2a3a5a;">視網膜桿狀細胞；角結膜</td>
                    <td style="padding:14px; border:1px solid #2a3a5a;">維持眼表上皮；缺乏可能夜盲或乾眼。</td>
                </tr>
                <tr>
                    <td style="padding:14px; border:1px solid #2a3a5a; color:#00ffcc; font-weight:bold;">DHA & Omega-3</td>
                    <td style="padding:14px; border:1px solid #2a3a5a;">感光細胞膜 / 淚膜、眼表</td>
                    <td style="padding:14px; border:1px solid #2a3a5a;">具生理結構角色；可能影響發炎與淚膜油脂層。</td>
                </tr>
                <tr>
                    <td style="padding:14px; border:1px solid #2a3a5a; color:#00ffcc; font-weight:bold;">維生素C、E、鋅、銅</td>
                    <td style="padding:14px; border:1px solid #2a3a5a;">水晶體、黃斑部</td>
                    <td style="padding:14px; border:1px solid #2a3a5a;">抗氧化營養素，組成AREDS2可延緩特定AMD惡化。不適合未經診斷自行長期高劑量服用。</td>
                </tr>
                <tr>
                    <td style="padding:14px; border:1px solid #2a3a5a; color:#00ffcc; font-weight:bold;">維生素B1、B12、葉酸</td>
                    <td style="padding:14px; border:1px solid #2a3a5a;">視神經</td>
                    <td style="padding:14px; border:1px solid #2a3a5a;">嚴重缺乏可能造成營養性視神經病變；主要為避免缺乏。</td>
                </tr>
            </tbody>
        </table>
    </div>
    <h3 style="color:#fffdd0; margin-bottom:12px; font-size:20px;">⚠️ 補充品使用注意</h3>
    <ul style="color:#8b9bb4; font-size:17px; line-height:1.8; margin-bottom:30px; padding-left:20px;">
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

// 【RPE 說明頁面】 (完整回復原本的 HTML 內容)
const rpePage = document.createElement('div');
rpePage.style.maxWidth = '800px';
rpePage.style.margin = '0 auto';
rpePage.style.paddingBottom = '50px';
rpePage.style.display = 'none'; 
rpePage.innerHTML = `
    <button id="back-to-nutrient-btn" style="padding:12px 24px; background:#1a2233; color:#fffdd0; border:1px solid #2a3a5a; border-radius:8px; margin-bottom:20px; cursor:pointer; font-size:18px; font-weight:bold;">🔙 返回護眼營養素</button>
    <h2 style="color:#fffdd0; font-size:28px; border-bottom:2px solid #00ffcc; padding-bottom:10px; margin-bottom:20px;">🏭 垃圾處理廠與清潔工：認識 RPE</h2>
    <div style="color:#8b9bb4; font-size:17px; line-height:1.8;">
        <p style="margin-bottom:15px;">我們可以把眼底的「視網膜色素上皮細胞 (RPE)」想像成眼底的<strong style="color:#fffdd0;">垃圾處理廠</strong>，而上方的感光細胞則是負責看東西的員工。</p>
        <h3 style="color:#00ffcc; margin-top:25px; margin-bottom:10px; font-size:20px;">一、什麼是脂褐質？它是怎麼形成的？</h3>
        <ul style="padding-left:20px; margin-bottom:20px;">
            <li><strong>員工天天產生垃圾：</strong>感光細胞每天工作會消耗能量，並脫落大量老舊廢棄物。</li>
            <li><strong>清潔工天天回收：</strong>健康的 RPE 每天會把垃圾吞進去，用溶小體酵素徹底分解化為養分。</li>
            <li><strong>變成陳年鐵鏽：</strong>若受藍光傷害或老化，處理廠酵素變弱。卡在肚子裡的油垢經光線照射後生鏽變質，形成了永遠無法清除的<strong style="color:#ff6b6b;">「脂褐質」</strong>。</li>
        </ul>
        <h3 style="color:#ff6b6b; margin-top:25px; margin-bottom:10px; font-size:20px;">三、不健康的 RPE（爛工廠）帶來的災難</h3>
        <ul style="padding-left:20px; margin-bottom:25px;">
            <li><strong style="color:#fffdd0;">1. 吃再多營養也吸收不了：</strong>就算吃再多高檔葉黃素，不健康的工廠也無法吸收利用。</li>
            <li><strong style="color:#fffdd0;">2. 眼底長斑堆垃圾：</strong>肚子被脂褐質塞爆後，把垃圾往地基亂倒，形成「隱形斑(Drusen)」。</li>
            <li><strong style="color:#fffdd0;">3. 眼睛結構大毀滅：</strong>防護牆破裂，引發濕性病變；最終員工集體餓死，導致視野中央出現黑洞失明。</li>
        </ul>
        <div style="background:#162b2b; padding:20px; border-radius:10px; text-align:center; border: 1px solid #00ffcc;">
            <p style="color:#fffdd0; font-size:19px; font-weight:bold; margin:0;">💡 總結</p>
            <p style="color:#00ffcc; font-size:18px; margin-top:10px; margin-bottom:0;">「健康的 RPE 能幫解消滅垃圾；<br>不健康的 RPE 會讓垃圾（脂褐質）堆成高山，最後把你的視力連根拔起。」</p>
        </div>
    </div>
`;
infoModal.appendChild(rpePage);

// 【遊戲模組醫學原理介紹頁面】
const moduleIntroPage = document.createElement('div');
moduleIntroPage.style.maxWidth = '800px';
moduleIntroPage.style.margin = '0 auto';
moduleIntroPage.style.paddingBottom = '50px';
moduleIntroPage.style.display = 'none'; 
infoModal.appendChild(moduleIntroPage);

const medicalPrinciples = {
    sop: { 
        icon: "🚀", title: "45秒快速舒緩", color: "#FF6B6B",
        principle: "此模組結合了「睫狀肌放鬆」、「動態視覺刺激」與「淚膜重建」。<br><br>透過注視遠近變化的球體，能迅速解除水晶體對焦痙攣；隨機出現的視覺刺激球能活化大腦視覺皮層；最後的強制用力閉眼，則能擠壓眼瞼板腺，使其均勻分泌油脂與淚液，有效改善乾眼症狀與假性近視疲勞。" 
    },
    stretch: { 
        icon: "🔄", title: "動態 3D 眼肌伸展", color: "#4D96FF",
        principle: "現代人長時間死盯著手機，眼球活動範圍極小，導致控制眼球的「眼外肌」僵硬缺血。<br><br>本模組利用最大範圍的 ∞ 字型（無限大）極限軌跡，強迫拉伸控制眼球的六條眼外肌，促進眼周血液循環；並配合 Z 軸的遠近空間感，全面恢復眼球靈活度與對焦彈性。" 
    },
    chaser: { 
        icon: "🎮", title: "睫狀肌深空追光", color: "#6BCB77",
        principle: "當我們近距離看螢幕時，眼內的「睫狀肌」會處於極度緊繃收縮的狀態。<br><br>這個遊戲利用 3D 透視原理創造出「無限遠（Optical Infinity）」的視覺錯覺。藉由死盯著流星飛向最深處，能強迫睫狀肌徹底放鬆、拉長，是解除深層視覺疲勞與預防度數加深的最佳物理復健法。" 
    },
    breathe: { 
        icon: "🌌", title: "星雲散焦與神經放鬆", color: "#FFD93D",
        principle: "高度專注盯著螢幕會造成「隧道視覺（Tunnel Vision）」，使大腦與自律神經長時間偏向緊繃的交感神經。<br><br>本模組引導您「放寬視野、不要對焦任何單顆星星」，啟動周邊視覺（Peripheral Vision），並配合深度共振呼吸法，能有效喚醒副交感神經，降低眼壓、放鬆眼底微血管，達到神經級的深度重置。" 
    }
};

function showModuleIntro(type) {
    nutrientPage.style.display = 'none';
    rpePage.style.display = 'none';
    moduleIntroPage.style.display = 'block';

    const data = medicalPrinciples[type];
    moduleIntroPage.innerHTML = `
        <button id="back-from-intro-btn" style="padding:12px 24px; background:#1a2233; color:#fffdd0; border:1px solid #2a3a5a; border-radius:8px; margin-bottom:20px; cursor:pointer; font-size:18px; font-weight:bold;">返回大廳</button>
        
        <h2 style="color:#fffdd0; font-size:32px; border-bottom:2px solid ${data.color}; padding-bottom:10px; margin-bottom:25px; display:flex; align-items:center; gap:10px;">
            <span>${data.icon}</span> ${data.title}
        </h2>
        
        <div style="background:#162b2b; border:1px solid ${data.color}; padding:25px 20px; border-radius:12px; margin-bottom:40px; box-shadow: 0 0 15px rgba(0,0,0,0.5);">
            <h3 style="color:${data.color}; font-size:22px; margin-bottom:15px; display:flex; align-items:center; gap:8px;">
                <span>🩺</span> 數位復健醫學原理
            </h3>
            <p style="color:#8b9bb4; font-size:18px; line-height:1.8; margin:0;">
                ${data.principle}
            </p>
        </div>
        
        <div style="text-align:center;">
            <button id="start-mod-btn" style="padding:18px 45px; background:${data.color}; color:#0f141e; border:none; border-radius:30px; font-size:22px; font-weight:bold; cursor:pointer; box-shadow:0 4px 15px ${data.color}60;">🚀 開始訓練</button>
        </div>
    `;

    document.getElementById('back-from-intro-btn').onclick = () => {
        infoModal.style.display = 'none';
        dashboardUI.style.display = 'flex';
    };

    document.getElementById('start-mod-btn').onclick = () => {
        infoModal.style.display = 'none';
        startTraining(type);
    };

    dashboardUI.style.display = 'none';
    infoModal.style.display = 'block';
    infoModal.scrollTo(0,0);
}

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
document.addEventListener('click', function(e){
    if(e.target && e.target.id == 'close-info-btn'){
          infoModal.style.display = 'none';
          dashboardUI.style.display = 'flex';
     }
 });

// ==========================================
// 大廳：護眼常見營養素 Banner & 選單
// ==========================================
const infoBanner = document.createElement('div');
infoBanner.style.width = '100%';
infoBanner.style.backgroundColor = '#162b2b';
infoBanner.style.border = '2px solid #00ffcc'; 
infoBanner.style.borderRadius = '12px';
infoBanner.style.padding = '20px';
infoBanner.style.cursor = 'pointer';
infoBanner.style.boxShadow = '0 0 15px rgba(0, 255, 204, 0.2)';
infoBanner.style.textAlign = 'center';
infoBanner.style.transition = 'all 0.2s ease';
infoBanner.style.boxSizing = 'border-box';
infoBanner.innerHTML = `
    <h3 style="color:#00ffcc; font-size:22px; margin-bottom:10px;">📖 護眼常見營養素與 RPE 百科</h3>
    <p style="color:#8b9bb4; font-size:16px; margin:0;">點擊了解護眼成分作用部位，以及視網膜垃圾處理廠 (RPE) 的重要性</p>
`;
infoBanner.onmouseover = () => {
    infoBanner.style.transform = 'translateY(-3px)';
    infoBanner.style.boxShadow = '0 0 25px rgba(0, 255, 204, 0.4)';
};
infoBanner.onmouseout = () => {
    infoBanner.style.transform = 'translateY(0)';
    infoBanner.style.boxShadow = '0 0 15px rgba(0, 255, 204, 0.2)';
};
infoBanner.onclick = () => {
    dashboardUI.style.display = 'none';
    infoModal.style.display = 'block';
    nutrientPage.style.display = 'block';
    rpePage.style.display = 'none';
    moduleIntroPage.style.display = 'none';
    infoModal.scrollTo(0,0);
};
contentContainer.appendChild(infoBanner);

const menuGrid = document.createElement('div');
menuGrid.style.display = 'flex';
menuGrid.style.flexDirection = 'column';
menuGrid.style.gap = '20px';
menuGrid.style.width = '100%';
contentContainer.appendChild(menuGrid);

function createModuleCard(title, desc, onClick, borderColor) {
    const card = document.createElement('div');
    card.style.backgroundColor = '#1a2233'; 
    card.style.border = `2px solid ${borderColor}`;
    card.style.borderRadius = '12px';
    card.style.padding = '24px 20px'; 
    card.style.cursor = 'pointer';
    card.style.transition = 'all 0.2s ease';
    card.style.boxSizing = 'border-box';
    card.style.width = '100%'; 

    card.onmouseover = () => {
        card.style.transform = 'translateY(-3px)';
        card.style.boxShadow = `0 0 25px ${borderColor}90`; 
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

menuGrid.appendChild(createModuleCard("🚀 45秒快速舒緩", "結合遠眺聚焦、隨機白球衝擊與深層閉眼潤滑。", () => showModuleIntro('sop'), '#FF6B6B')); 
menuGrid.appendChild(createModuleCard("🔄 動態 3D 眼肌伸展", "引導眼球進行 ∞ 字型極限軌跡，並結合 Z 軸遠近對焦。", () => showModuleIntro('stretch'), '#4D96FF')); 
menuGrid.appendChild(createModuleCard("🎮 睫狀肌深空追光", "【放鬆遊戲】死盯流星飛向深空，強迫睫狀肌徹底看遠放鬆。", () => showModuleIntro('chaser'), '#6BCB77')); 
menuGrid.appendChild(createModuleCard("🌌 星雲散焦與神經放鬆", "【深度冥想】釋放隧道視覺，同步 3D 粒子星雲進行共振呼吸。", () => showModuleIntro('breathe'), '#FFD93D')); 
menuGrid.appendChild(createModuleCard("🔍 黃斑部自我檢測", "經典阿姆斯勒方格表數位化，快篩視網膜病變風險。", () => startTraining('amsler'), '#9D4EDD')); 
menuGrid.appendChild(createModuleCard("👁️ 散光軸向自我檢測", "放射鐘測試。檢測是否因散光未矯正而導致嚴重疲勞。", () => startTraining('astigmatism'), '#FF9F1C')); 

// 大廳底部：隱藏式產品推廣按鈕
const adBannerBtn = document.createElement('div');
adBannerBtn.style.width = '100%';
adBannerBtn.style.border = '2px dashed #ffff00'; 
adBannerBtn.style.borderRadius = '12px';
adBannerBtn.style.padding = '20px';
adBannerBtn.style.cursor = 'pointer';
adBannerBtn.style.display = 'flex';
adBannerBtn.style.justifyContent = 'space-between';
adBannerBtn.style.alignItems = 'center';
adBannerBtn.style.boxSizing = 'border-box';
adBannerBtn.innerHTML = `
    <div style="color: #fffdd0; font-size: 18px; font-weight: bold; display: flex; align-items: center; gap: 10px;">
        <span style="color:#ffff00; font-size: 22px;">💡</span> 補充眼睛完整營養
    </div>
    <div style="color: #666; font-size: 20px; font-weight: bold;">></div>
`;
adBannerBtn.onclick = () => {
    dashboardUI.style.display = 'none';
    adModal.style.display = 'block';
    adModal.scrollTo(0,0);
};
contentContainer.appendChild(adBannerBtn);

// ==========================================
// 產品推廣互動視窗 (Ad Modal)
// ==========================================
const adModal = document.createElement('div');
adModal.style.position = 'absolute';
adModal.style.top = '0';
adModal.style.left = '0';
adModal.style.width = '100vw';
adModal.style.height = '100vh';
adModal.style.backgroundColor = '#0f141e';
adModal.style.zIndex = '50';
adModal.style.overflowY = 'auto';
adModal.style.display = 'none';
adModal.style.padding = '20px';
adModal.style.boxSizing = 'border-box';
adModal.style.fontFamily = 'sans-serif';
document.body.appendChild(adModal);

const adContainer = document.createElement('div');
adContainer.style.maxWidth = '800px';
adContainer.style.margin = '0 auto';
adContainer.style.paddingBottom = '50px';

const closeAdBtn = document.createElement('button');
closeAdBtn.innerText = "返回大廳";
closeAdBtn.style.padding = '12px 24px';
closeAdBtn.style.background = '#1a2233';
closeAdBtn.style.color = '#fffdd0';
closeAdBtn.style.border = '1px solid #2a3a5a';
closeAdBtn.style.borderRadius = '8px';
closeAdBtn.style.marginBottom = '20px';
closeAdBtn.style.cursor = 'pointer';
closeAdBtn.style.fontSize = '18px';
closeAdBtn.style.fontWeight = 'bold';
closeAdBtn.onclick = () => {
    adModal.style.display = 'none';
    dashboardUI.style.display = 'flex';
};
adContainer.appendChild(closeAdBtn);

// 【產品推廣頁面】 (完整回復原本的 HTML 內容)
const adWhiteBox = document.createElement('div');
adWhiteBox.style.backgroundColor = '#ffffff'; 
adWhiteBox.style.borderRadius = '20px';
adWhiteBox.style.padding = '30px 20px';
adWhiteBox.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
adWhiteBox.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
        <div style="font-weight:900; font-size:18px; color:#b8982a;">PP<span style="color:#333;">LS</span> <span style="font-size:12px; color:#999; font-weight:normal; letter-spacing:1px;">INSIDE</span></div>
        <div style="display:flex; align-items:center;">
            <img src="./NBM logo.jpg" alt="NBM Logo" style="height:40px; object-fit:contain;">
        </div>
    </div>
    
    <h2 style="text-align:center; color:#1A4B82; font-size:28px; font-weight:bold; margin-bottom:40px;">補充眼睛完整營養</h2>
    
    <div style="display:flex; justify-content:center; margin-bottom:45px;">
        <div style="width: 260px; height: 380px; position: relative; background: #fff; border-radius: 8px; box-shadow: 0 15px 35px rgba(0,0,0,0.15); overflow: hidden; border: 1px solid #eaeaea;">
            <div style="position: absolute; right: 0; top: 0; width: 45%; height: 100%; background-color: #1A4B82; clip-path: polygon(25% 0, 100% 0, 100% 100%, 0 100%);"></div>
            <div style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; padding: 30px 20px; box-sizing: border-box; display: flex; flex-direction: column; text-align: left; z-index: 2;">
                <div style="font-size: 13px; color: #666; font-weight: bold; margin-bottom: 25px;">PPLs® VisionCare</div>
                <div style="margin-bottom: 35px;">
                    <div style="font-size: 14px; font-weight: bold; color: #666; margin-bottom: 2px;">第二代</div>
                    <div style="font-size: 28px; font-weight: 900; color: #1A4B82; border-bottom: 3px solid #1A4B82; display: inline-block; padding-bottom: 4px;">視祐全</div>
                    <div style="font-size: 13px; font-weight: bold; color: #333; margin-top: 8px;">專利配方效果好</div>
                </div>
                <div>
                    <div style="font-size: 28px; font-weight: 900; color: #1A4B82; border-bottom: 3px solid #1A4B82; display: inline-block; padding-bottom: 4px;">新視祐全</div>
                    <div style="font-size: 13px; font-weight: bold; color: #333; margin-top: 8px;">加了魚油更滋潤</div>
                </div>
                <div style="margin-top: auto; font-size: 11px; color: #666; font-weight: bold;">◼ 連續榮獲多項專利肯定</div>
            </div>
        </div>
    </div>

    <div style="text-align:center; margin-bottom:35px; font-size:20px; font-weight:bold; color:#444; line-height:2;">
        <div>維持補充 每日 <span style="color:#d9534f; font-size:28px; margin:0 5px;">4</span> 粒</div>
        <div>加強提升 每日 <span style="color:#d9534f; font-size:28px; margin:0 5px;">6</span> 粒</div>
    </div>

    <div style="background-color:#f4f9ff; border:2px solid #b3d4f0; border-radius:15px; padding:20px 15px; text-align:center; margin-bottom:25px;">
        <div style="color:#1A4B82; font-size:22px; font-weight:bold; margin-bottom:8px;">補充專利PPLs®配方</div>
        <div style="color:#555; font-size:15px; font-weight:bold;">營養進得去，廢物出得來</div>
    </div>

    <div style="text-align:center; color:#999; font-size:12px; line-height:1.8;">
        <div>專利字號：發明第 I 719962 號</div>
        <div>專利字號：發明第 I 766565 號</div>
    </div>
`;
adContainer.appendChild(adWhiteBox);
adModal.appendChild(adContainer);

// ==========================================
// 遊戲介面 (Training UI)
// ==========================================
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

// 模組 1: SOP (45秒快速舒緩)
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

// 模組 2: Stretch (動態 3D 眼肌伸展)
const stretchGroup = new THREE.Group();
const stretchOrb = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff9900 }));
stretchOrb.add(new THREE.PointLight(0xffaa00, 2.5, 60));
stretchGroup.add(stretchOrb);
scene.add(stretchGroup);

// 模組 3: Amsler (黃斑部自我檢測)
const amslerGroup = new THREE.Group();
const gridHelper = new THREE.GridHelper(30, 30, 0x557799, 0x445566);
gridHelper.rotation.x = Math.PI / 2; gridHelper.position.z = -15; 
amslerGroup.add(gridHelper);
const centerDot = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
centerDot.position.z = -14.9; 
amslerGroup.add(centerDot);
scene.add(amslerGroup);

// 模組 4: Astigmatism (散光軸向自我檢測)
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

// 模組 5: Breathe (星雲散焦與神經放鬆)
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

// 模組 6: Chaser (睫狀肌深空追光)
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
        bgmPlayer.src = '/game1.mp3'; // 指定遊戲 1 音樂
        playBGM(); 
    } else if (type === 'stretch') {
        stretchGroup.visible = true; stretchTimeLeft = 45; stretchOrb.position.set(0, 0, -30);
        bgmPlayer.src = '/game2.mp3'; // 指定遊戲 2 音樂
        playBGM();
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
    if (currentModule === 'sop' || currentModule === 'stretch') {
        stopBGM(); // 確保遊戲 1 或 2 中斷時都會停音樂
    }

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
    
    const time = Date.now(); 
    // 【修改點】：將這裡原本的 0.0015 調成 0.0012，以搭配 game1.mp3 的緩慢節奏
    const timeDelta = time * 0.0012; 

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
// 7. 狀態機與倒數計時器 (整合寫入雲端邏輯)
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
            if (phase === 'LOOKING') { 
                phase = 'CLOSING'; sopTimeLeft = 5; 
            } else if (phase === 'CLOSING') { 
                cycle++; 
                if (cycle > maxCycles) { 
                    phase = 'COMPLETED'; 
                    stopBGM(); // 【修改點】：訓練順利完成時，停止音樂
                    playDingSound(); 
                    logTraining('45秒快速舒緩', 45);
                } else { 
                    phase = 'LOOKING'; sopTimeLeft = 10; playDingSound(); 
                } 
            }
        }
    } 
    else if (currentModule === 'stretch') { 
        if (stretchTimeLeft <= 0) return; 
        stretchTimeLeft--; 
        if (stretchTimeLeft <= 0) {
            isResting = true;
            restTimeLeft = 5;
            stopBGM(); // 【新增】：伸展結束時停止音樂
            playDingSound(); 
            logTraining('動態 3D 眼肌伸展', 45);
        }
    }
    else if (currentModule === 'chaser') { 
        if (chaserTimeLeft <= 0) return; 
        chaserTimeLeft--; 
        if (chaserTimeLeft <= 0) {
            isResting = true;
            restTimeLeft = 5;
            playDingSound(); 
            logTraining('睫狀肌深空追光', 60);
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
            logTraining('星雲散焦與神經放鬆', 60);
        }
    }
    else if (currentModule === 'amsler' || currentModule === 'astigmatism') {
        if (testPhase === 'COMPLETED') return; 
        testTimeLeft--;
        if (testTimeLeft <= 0) {
            if (testPhase === 'LEFT_EYE') { 
                testPhase = 'RIGHT_EYE'; testTimeLeft = 15; playDingSound(); 
            } else if (testPhase === 'RIGHT_EYE') { 
                testPhase = 'COMPLETED'; playDingSound(); 
                logTraining(currentModule === 'amsler' ? '黃斑部自我檢測' : '散光軸向自我檢測', 30);
            }
        }
    }
    updateTrainingUI();
}, 1000);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});