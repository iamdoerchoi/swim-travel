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

function getResultCopy(distanceM: number) {
  let text = RESULT_TIERS[0].text;
  for (const tier of RESULT_TIERS) {
    if (distanceM >= tier.min) text = tier.text;
  }
  return text;
}

function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [result, setResult] = useState<GameResult | null>(null);

  const handleGameOver = useCallback((r: GameResult) => {
    setResult(r);
    setScreen('result');
  }, []);

  return (
    <div className="app-shell">
      {screen === 'start' && (
        <div className="screen start-screen">
          <h1>오늘도 하찮게 수영중</h1>
          <p className="subtitle">탭해서 헤엄치고, 손 떼면 가라앉아요</p>
          <div className="hero-emoji">🏊‍♀️🌊</div>
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
          <p className="subtitle">{getResultCopy(result.distanceM)}</p>
          <div className="result-stats">
            <span>🍦 {result.itemsCollected}개 수집</span>
            <span>총점 {result.score}</span>
          </div>
          <button
            type="button"
            className="primary-btn"
            onClick={() => setScreen('playing')}
          >
            다시하기
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
