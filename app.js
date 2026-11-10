// Firebase SDK 모듈 임포트 (Firestore 대신 database 임포트)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// TODO: Firebase 콘솔에서 발급받은 구성 정보로 교체하세요.
const firebaseConfig = {
  apiKey: "AIzaSyCSUkoVMgrEw-3qjygdElb-R5AXMKL_IgQ",
  authDomain: "aaaa-a40f9.firebaseapp.com",
  projectId: "aaaa-a40f9",
  storageBucket: "aaaa-a40f9.firebasestorage.app",
  messagingSenderId: "1003486620509",
  appId: "1:1003486620509:web:fdb6d883c7f752775d16b4"
};

// Firebase 초기화 (Realtime Database 연동)
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 테스트용 단일 사용자 DB 경로
const userDbPath = "user_preferences/test_user";

// TODO: 공공데이터포털 일반 인증키(Encoding)로 교체하세요.
const TOUR_API_KEY = "YOUR_TOUR_API_KEY"; 

const regionSelect = document.getElementById("regionSelect");
const listContainer = document.getElementById("listContainer");
const tourList = document.getElementById("tourList");
const regionTitle = document.getElementById("regionTitle");

// 1. 초기 로딩 시 Realtime Database 데이터 확인
window.addEventListener("DOMContentLoaded", async () => {
  const dbRef = ref(db);
  try {
    const snapshot = await get(child(dbRef, userDbPath));
    if (snapshot.exists() && snapshot.val().regionCode) {
      const savedData = snapshot.val();
      regionSelect.value = savedData.regionCode; // 셀렉트 박스 동기화
      fetchTourData(savedData.regionCode, savedData.regionName);
    } else {
      listContainer.style.display = "none";
    }
  } catch (error) {
    console.error("Firebase 데이터를 불러오는 중 오류 발생:", error);
  }
});

// 2. 사용자가 지역을 선택할 때마다 Realtime Database 업데이트 및 API 호출
regionSelect.addEventListener("change", async (e) => {
  const regionCode = e.target.value;
  const regionName = e.target.options[e.target.selectedIndex].text;

  if (!regionCode) return;

  try {
    // Realtime Database에 선택한 지역 정보 업데이트
    await set(ref(db, userDbPath), {
      regionCode: regionCode,
      regionName: regionName,
      updatedAt: new Date().toISOString()
    });

    fetchTourData(regionCode, regionName);
  } catch (error) {
    console.error("Firebase 저장 실패:", error);
  }
});

// 3. 한국관광공사 API 호출
async function fetchTourData(regionCode, regionName) {
  const url = `https://apis.data.go.kr/B551011/KorService2/areaBasedList1?serviceKey=${TOUR_API_KEY}&numOfRows=12&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json&listYN=Y&arrange=O&areaCode=${regionCode}`;

  try {
    const response = await fetch(url);
    const result = await response.json();
    const items = result.response.body.items.item;
    renderTourList(items, regionName);
  } catch (error) {
    console.error("API 호출 실패:", error);
  }
}

// 4. 화면 렌더링
function renderTourList(items, regionName) {
  tourList.innerHTML = ""; 
  
  if (!items || items.length === 0) {
    tourList.innerHTML = "<p>해당 지역의 관광 정보가 없습니다.</p>";
  } else {
    items.forEach(item => {
      const imageUrl = item.firstimage ? item.firstimage : 'https://via.placeholder.com/300x200/ffd6e0/ffffff?text=No+Image';
      const card = document.createElement("div");
      card.className = "tour-card";
      card.innerHTML = `
        <img src="${imageUrl}" alt="${item.title}" class="tour-image" loading="lazy">
        <div class="tour-info">
          <h3>${item.title}</h3>
          <p>${item.addr1} ${item.addr2}</p>
        </div>
      `;
      tourList.appendChild(card);
    });
  }

  regionTitle.textContent = `${regionName}의 추천 관광지`;
  listContainer.style.display = "block";
}
