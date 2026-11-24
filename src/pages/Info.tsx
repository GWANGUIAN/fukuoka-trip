import { ExternalLink, Lightbulb, Link2, Smartphone } from 'lucide-react';
import { trip } from '../data/trip';

export function Info() {
  return (
    <div className="page">
      <div>
        <h1 className="page-title">여행 정보</h1>
        <p className="page-sub">알아두면 좋은 것들</p>
      </div>

      <section>
        <h2 className="section-title"><Lightbulb size={16} /> 팁</h2>
        <div className="card list">
          {trip.tips.map((t) => (
            <div key={t.title} className="list-row" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="small" style={{ fontWeight: 700 }}>{t.title}</div>
                <div className="small muted">{t.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title"><Link2 size={16} /> 유용한 링크</h2>
        <div className="card list">
          {trip.links.map((l) => (
            <a key={l.url} className="list-row" href={l.url} target="_blank" rel="noreferrer">
              <span className="small" style={{ flex: 1, fontWeight: 600 }}>{l.title}</span>
              <ExternalLink size={15} className="faint" />
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title"><Smartphone size={16} /> 앱으로 쓰기</h2>
        <div className="card small muted stack">
          <div>안드로이드: GitHub Releases에서 APK를 받아 설치하거나, 크롬 메뉴 → <b>홈 화면에 추가</b>.</div>
          <div>아이폰: 사파리 공유 버튼 → <b>홈 화면에 추가</b>.</div>
          <div>한 번 열어두면 오프라인에서도 일정을 볼 수 있어요.</div>
        </div>
      </section>

      <div className="footer-note">
        {trip.members.join(' · ')}
        <br />
        마지막 업데이트 {trip.updatedAt}
      </div>
    </div>
  );
}
