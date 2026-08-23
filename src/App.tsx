import { useCallback, useState } from 'react';
import { Game, type GameResult } from './game/Game';
import './App.css';

type Screen = 'start' | 'playing' | 'result';

const RESULT_TIERS = [
  { min: 0, text: '몸 풀기만 했네요 🫠' },
  { min: 20, text: '그럭저럭 헤엄쳤어요 🏊' },
  { min: 50, text: '제법인데요? 체감온도 -1도' },
  { min: 100, text: '찐 물개 등극 🦭 체감온도 -3도' },
  { min: 200, text: '이 정도면 국가대표감 🥇 체감온도 -5도' },
];

const BEST_DISTANCE_KEY = 'swim-travel-best-distance';

function getResultCopy(distanceM: number) {
  let text = RESULT_TIERS[0].text;
  for (const tier of RESULT_TIERS) {
    if (distanceM >= tier.min) text = tier.text;
  }
  return text;
}

function readBestDistance() {
  const stored = Number(localStorage.getItem(BEST_DISTANCE_KEY));
  return Number.isFinite(stored) ? stored : 0;
}

function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [result, setResult] = useState<GameResult | null>(null);
  const [bestDistance, setBestDistance] = useState(readBestDistance);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  const handleGameOver = useCallback(
    (r: GameResult) => {
      setResult(r);
      setScreen('result');
      setShareStatus('idle');
      if (r.distanceM > bestDistance) {
        setIsNewRecord(true);
        setBestDistance(r.distanceM);
        localStorage.setItem(BEST_DISTANCE_KEY, String(r.distanceM));
      } else {
        setIsNewRecord(false);
      }
    },
    [bestDistance],
  );

  const handleShare = useCallback(async () => {
    if (!result) return;
    const shareText = `오늘도 하찮게 수영중 🏊‍♀️ ${result.distanceM}m 헤엄쳤어요! 너도 도전해볼래?`;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url: shareUrl });
      } catch {
        // 사용자가 공유를 취소한 경우 등은 무시
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch {
      // 클립보드 접근 불가 환경에서는 조용히 무시
    }
  }, [result]);

  return (
    <div className="app-shell">
      {screen === 'start' && (
        <div className="screen start-screen">
          <h1>오늘도 하찮게 수영중</h1>
          <p className="subtitle">탭해서 헤엄치고, 손 떼면 가라앉아요</p>
          <div className="hero-emoji">
            <span className="swimmer">🏊‍♀️</span>
            <span className="wave">🌊</span>
          </div>
          {bestDistance > 0 && (
            <p className="best-record">🏆 최고 기록 {bestDistance}m</p>
          )}
          <button
            type="button"
            className="primary-btn"
            onClick={() => setScreen('playing')}
          >
            시작하기
          </button>
        </div>
      )}

      {screen === 'playing' && <Game onGameOver={handleGameOver} />}

      {screen === 'result' && result && (
        <div className="screen result-screen">
          <h1>{result.distanceM}m 헤엄쳤어요!</h1>
          <p className="subtitle">
            {isNewRecord ? '🎉 신기록이에요!' : getResultCopy(result.distanceM)}
          </p>
          {!isNewRecord && (
            <p className="best-record">🏆 최고 기록 {bestDistance}m</p>
          )}
          <div className="result-stats">
            <span>🍦 {result.itemsCollected}개 수집</span>
            <span>총점 {result.score}</span>
          </div>
          <div className="result-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => setScreen('playing')}
            >
              다시하기
            </button>
            <button type="button" className="share-btn" onClick={handleShare}>
              {shareStatus === 'copied' ? '복사됐어요!' : '결과 공유하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
