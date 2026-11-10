// Firebase SDK 모듈 임포트
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TODO: Firebase 콘솔에서 발급받은 구성 정보로 교체하세요.
const firebaseConfig = {
  apiKey: "AIzaSyCSUkoVMgrEw-3qjygdElb-R5AXMKL_IgQ",
  authDomain: "aaaa-a40f9.firebaseapp.com",
  projectId: "aaaa-a40f9",
  storageBucket: "aaaa-a40f9.firebasestorage.app",
  messagingSenderId: "1003486620509",
  appId: "1:1003486620509:web:fdb6d883c7f752775d16b4"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 테스트용 단일 사용자 문서 (실제 서비스에서는 Firebase Auth UID 활용 권장)
const USER_DOC_REF = doc(db, "user_preferences", "test_user");

// TODO: 공공데이터포털 일반 인증키(Encoding)로 교체하세요.
const TOUR_API_KEY = "83048396a6093d92be2298098e7d3737f2cc077333bc6a795268044d5ebb44c2"; 

const regionSelect = document.getElementById("regionSelect");
const listContainer = document.getElementById("listContainer");
const tourList = document.getElementById("tourList");
const regionTitle = document.getElementById("regionTitle");

// 1. 초기 로딩 시 Firebase 데이터 확인
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const docSnap = await getDoc(USER_DOC_REF);
    if (docSnap.exists() && docSnap.data().regionCode) {
      const savedRegion = docSnap.data().regionCode;
      regionSelect.value = savedRegion; // 셀렉트 박스 동기화
      fetchTourData(savedRegion, regionSelect.options[regionSelect.selectedIndex].text);
    } else {
      // 저장된 지역 정보가 없으면 시각화 목록 뷰 숨김
      listContainer.style.display = "none";
    }
  } catch (error) {
    console.error("Firebase 데이터를 불러오는 중 오류 발생:", error);
  }
});

// 2. 사용자가 지역을 선택할 때마다 Firebase 업데이트 및 API 호출
regionSelect.addEventListener("change", async (e) => {
  const regionCode = e.target.value;
  const regionName = e.target.options[e.target.selectedIndex].text;

  if (!regionCode) return;

  try {
    // Firebase에 선택한 지역 정보 업데이트 (계속 덮어쓰기됨)
    await setDoc(USER_DOC_REF, { 
      regionCode: regionCode,
      regionName: regionName,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    fetchTourData(regionCode, regionName);
  } catch (error) {
    console.error("Firebase 저장 실패:", error);
  }
});

// 3. 한국관광공사 국문 관광정보 조회 API 호출 및 화면 렌더링
async function fetchTourData(regionCode, regionName) {
  // arrange=O 를 사용하여 이미지가 있는 데이터를 우선적으로 가져옵니다.
  const url = `https://apis.data.go.kr/B551011/KorService1/areaBasedList1?serviceKey=${TOUR_API_KEY}&numOfRows=12&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json&listYN=Y&arrange=O&areaCode=${regionCode}`;

  try {
    const response = await fetch(url);
    const result = await response.json();
    const items = result.response.body.items.item;

    renderTourList(items, regionName);
  } catch (error) {
    console.error("API 호출 실패:", error);
  }
}

// 4. 받아온 데이터를 바탕으로 카드 형태의 시각화 뷰 생성
function renderTourList(items, regionName) {
  tourList.innerHTML = ""; // 기존 목록 초기화
  
  if (!items || items.length === 0) {
    tourList.innerHTML = "<p>해당 지역의 관광 정보가 없습니다.</p>";
  } else {
    items.forEach(item => {
      // 이미지가 없는 경우를 대비한 기본 썸네일 처리
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

  // 뷰를 표시하고 제목 업데이트
  regionTitle.textContent = `${regionName}의 추천 관광지`;
  listContainer.style.display = "block";
}