import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, 
  collection,
  addDoc,
  serverTimestamp,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { writeBatch, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; // 批量匯入

const firebaseConfig = {
  apiKey: "AIzaSyBaAUlyum8C2xNxXFhni-4Dxquo8r6D8bE",
  authDomain: "toeic-word-card-1.firebaseapp.com",
  projectId: "toeic-word-card-1",
  storageBucket: "toeic-word-card-1.firebasestorage.app",
  messagingSenderId: "380940917521",
  appId: "1:380940917521:web:c27682730869cb8fcd4ab0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/////////////////////////////////////

// 清空輸入欄
function clearInput(){
    document.getElementById("input_en").value = "";
    document.getElementById("input_ch").value = "";
}

// 存入單字
document.getElementById("save_btn").addEventListener("click", async () => {

    const en = document.getElementById("input_en").value.trim(); // trim() 會只留內容
    const ch = document.getElementById("input_ch").value.trim();

    // 不可為空
    if (!en || !ch) {
        alert("請輸入完整資料");
        return;
    }

    try {
        await addDoc(collection(db, "words"), {
            en,
            ch,
            createdAt: serverTimestamp(), // 比較準的時間
        });

        clearInput()

    } catch (error) {
        console.error("新增失敗:", error);
        alert("新增失敗");
    }
});

// 測驗
let correct_cnt=0;
let wrong_cnt=0;

let allWords = [];

async function loadWordsOnce() { // 只讀一次重複用
    const snapshot = await getDocs(collection(db, "words"));
    allWords = snapshot.docs.map(doc => doc.data());

    document.getElementById("word_num").innerText = allWords.length; // 顯示單字庫數量
}

loadWordsOnce()

async function renderQuiz() {
    //const snapshot = await getDocs(collection(db, "words")); // 每次都讀整個資料庫
    //const words = snapshot.docs.map(doc => doc.data());
    const words = allWords; // 重複利用之前讀到的

    if (words.length < 4) {
        alert("單字至少要4筆");
        return;
    }

    // 洗牌
    const shuffled = words.sort(() => Math.random() - 0.5);

    // 取4個
    const options = shuffled.slice(0, 4);

    // 隨機正確答案
    const correctIndex = Math.floor(Math.random() * 4);
    const correct = options[correctIndex];

    // 題目（英文）
    document.getElementById("question").innerText = correct.en;

    // 按鈕
    const btns = [
        document.getElementById("btn_a"),
        document.getElementById("btn_b"),
        document.getElementById("btn_c"),
        document.getElementById("btn_d")
    ];

    btns.forEach((btn, i) => {
        btn.innerText = options[i].ch;

        btn.onclick = () => {
            if (options[i].ch === correct.ch) {
                //alert("✅ 正確");
                toastr.success( "✅ 正確" );
                correct_cnt++;
                document.getElementById("correct").innerText = correct_cnt;
    
            } else {
                //alert("❌ 錯誤\n正確答案是：" + correct.ch);
                toastr.error( "❌ 錯誤\n正確答案是：" + correct.ch); 
                wrong_cnt++;
                document.getElementById("wrong").innerText = wrong_cnt;
            }

            // 下一題（可選）
            renderQuiz();
        };
    });
}

document.getElementById("test_btn").addEventListener("click",renderQuiz)


// 匯入
document.getElementById("import_btn").addEventListener("click", async () => {

    const fileInput = document.getElementById("file_input");
    const file = fileInput.files[0];

    if (!file) {
        alert("請先選擇檔案");
        return;
    }

    const text = await file.text();

    const lines = text.split("\n");

    const batch = writeBatch(db);

    let count = 0;

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        // 支援 , 或 tab
        let parts = line.includes(",") ? line.split(",") : line.split("\t");

        if (parts.length < 2) return;

        const en = parts[0].trim();
        const ch = parts[1].trim();

        if (!en || !ch) return;

        const ref = doc(collection(db, "words"));

        batch.set(ref, {
            en,
            ch,
            createdAt: serverTimestamp()
        });

        count++;
    });

    try {
        await batch.commit();
        alert(`🚀 匯入成功 ${count} 筆`);
    } catch (e) {
        console.error(e);
        alert("匯入失敗");
    }

});


// toast 設定
toastr.options = {
  	// 參數設定
  	"closeButton": false, // 顯示關閉按鈕
  	"debug": false, // 除錯
  	"newestOnTop": false,  // 最新一筆顯示在最上面
  	"progressBar": true, // 顯示隱藏時間進度條
  	"positionClass": "toast-top-right", // 位置的類別 bottom left
  	"preventDuplicates": false, // 隱藏重覆訊息
  	"onclick": null, // 當點選提示訊息時，則執行此函式
  	"showDuration": "300", // 顯示時間(單位: 毫秒)
  	"hideDuration": "1000", // 隱藏時間(單位: 毫秒)
  	"timeOut": "3000", // 當超過此設定時間時，則隱藏提示訊息(單位: 毫秒)
  	"extendedTimeOut": "1000", // 當使用者觸碰到提示訊息時，離開後超過此設定時間則隱藏提示訊息(單位: 毫秒)
  	"showEasing": "swing", // 顯示動畫時間曲線
  	"hideEasing": "linear", // 隱藏動畫時間曲線
  	"showMethod": "fadeIn", // 顯示動畫效果
  	"hideMethod": "fadeOut" // 隱藏動畫效果
}
//toastr.success( "Success" );
//toastr.warning( "Warning" );
//toastr.error( "Error" ); 

