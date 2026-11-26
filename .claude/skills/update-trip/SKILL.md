---
name: update-trip
description: 후쿠오카 여행 앱(지연이와 아이들의 후쿠오카 여행)에 새 일정 데이터(md 파일·예약 캡처·메시지)를 반영하고 push 해서 GitHub Pages에 배포한다. "최신 데이터 반영해줘", "일정 업데이트", "예약 확정됐어" 같은 요청이나 여행 데이터 md 파일이 첨부되면 사용.
---

# 여행 데이터 업데이트 & 배포

사용자가 준 최신 여행 데이터(보통 `C:\Users\bbaa3\Downloads\fukuoka-trip-app-data.md`, 또는 예약 화면 캡처·메시지)를 앱에 반영하고 배포까지 끝낸다.

## 데이터가 있는 곳
- `src/data/trip.ts` — 일정(days/items), 항공, 숙소(hotel.details/notes), 할 일(todos, D-day 알림), 확인할 것(risks), 준비물, 팁, 링크, `updatedAt`
- `src/data/places.ts` — 장소 정보(이름·일본어 상호·주소·좌표·영업시간·지도 cid 링크·예약 URL·예약 메모·블로그)
- `src/data/types.ts` — 타입. 상태는 `confirmed`(확정) · `booked`(예약완료) · `pending`(조율중, 홈 "아직 조율 중"에 노출) · `candidate`(후보) · `optional`(선택) · `excluded`(제외)

## 절차
1. **비교**: 새 데이터와 `trip.ts`·`places.ts` 현재 내용을 항목별로 비교해 바뀐 점(시간·상태·장소·예약 상세·취소·새 리스크·새 예약 오픈일)을 정리한다.
2. **최신 데이터로 반영**
   - 상태 매핑: `[확정]`·`[3인 합의 확정]` → confirmed, `[예약완료]` → booked, `[예약 진행중]`·`[조율중]` → pending, `[후보]` → candidate, `(선택)` → optional/alternatives, `[제외]` → 해당 Day의 `excluded`.
   - 새 장소는 places.ts에 추가: 일본어 상호(`nameJa`), 알면 일본어 주소(`address` — 길찾기 검색에 최우선), cid 지도 링크(`mapUrl`), 대략 좌표(지도 핀·도보 시간 계산용). 주소를 모르면 WebSearch로 확인하되, 확실하지 않으면 넣지 말고 cid 링크만 둔다.
   - 예약 상세(시간·인원·좌석·코스/가격·체류 시간·노쇼 규칙)는 장소의 `reservation.note`/`memo` 또는 일정 `note`에 넣는다.
   - 예약 오픈일·취소 마감 같은 날짜는 `todos`에, 미확정 사항은 `risks`에.
   - `updatedAt`을 새 데이터 기준 시각으로 갱신.
3. **더 이상 필요 없는 내용은 삭제**: 취소 완료된 예약, 끝난 할 일, 해결된 리스크, 어디에서도 안 쓰는 장소, 사라진 대안 등은 지운다. (제외된 후보를 기록으로 남길 가치가 있으면 Day `excluded`로만 남긴다.) 삭제 후 `grep`으로 남은 참조가 없는지 확인.
4. **추가 레이아웃·기능 (선택)**: 데이터 성격상 꼭 필요하면 추가해도 된다 — 예: 새 필드를 보여줄 화면 요소, 새 종류의 알림, 예약 상세 카드 등. **필요 없으면 추가하지 않는다.** 추가할 땐 기존 컴포넌트·CSS 토큰(`src/styles/global.css`)·디자인 톤(깔끔·심플)을 따른다.
5. **개인정보 주의**: 레포와 사이트는 public이다. 예약번호, 결제 금액, 전화번호, 이메일 등은 사용자가 명시적으로 원할 때만 넣는다.
6. **검증**: `npm run build` 통과 → `preview_start {name: "web"}`로 열어(`/fukuoka-trip/#/schedule?day=N`) 바뀐 날짜·홈 화면을 `get_page_text`로 확인, 콘솔 에러 없는지 확인 → 프리뷰 종료.
7. **커밋·push (여기서 작업 종료)**
   - main에 커밋(메시지는 한국어로 무엇이 바뀌었는지 요약) 후 `git push`.
   - push하면 `.github/workflows/deploy.yml`이 자동으로 Pages에 배포하므로 **push 이후 작업은 하지 않는다** — Actions 대기(`gh run watch`), 배포 사이트 curl 확인, APK 재빌드 등은 하지 말고 바로 보고로 넘어간다.
   - 설치된 앱·PWA는 원격 URL을 로드하고 자동 업데이트되므로 APK 재빌드는 필요 없다. 아이콘·앱 이름·Capacitor 설정을 바꿨다면 재빌드가 필요하다고 보고에만 적는다.
8. **보고**: 바뀐 점, 삭제한 것, 추가 기능(있다면), 넣지 않은 정보와 이유, 데이터상 애매해서 판단한 부분을 짧게 알려준다.
