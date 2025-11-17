// src/components/Leaderboard.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

type Leader = {
  score: number;
  recorded_at: string;
  profiles: { username: string; avatar_url?: string };
};

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    supabase
      .from('trivia_scores')
      .select('score, recorded_at, profiles(username, avatar_url)')
      .order('score', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setLeaders(data as any);
      });
  }, []);

  return (
    <div>
      <h2>🏆 Global Trivia Leaderboard</h2>
      <ol>
        {leaders.map((l, i) => (
          <li key={i}>
            {l.profiles.username}: {l.score}
          </li>
        ))}
      </ol>
    </div>
  );
}
