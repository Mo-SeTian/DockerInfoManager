import { useState, useEffect, useCallback } from 'react';
import * as api from '../utils/api';

export interface ContainerData {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  ports: { host_ip: string; host_port: number | null; container_port: number; protocol: string }[];
  created_at: string | null;
  alias: string | null;
  icon: string | null;
  group_name: string | null;
  notes: string | null;
  is_favorite: boolean;
  jump_protocol: string;
  jump_port: number | null;
}

export interface StatsData {
  total_containers: number;
  running: number;
  stopped: number;
  paused: number;
  exited: number;
  total_images: number;
}

export interface GroupData {
  id: number;
  name: string;
  color: string;
  sort_order: number;
  container_count: number;
  running_count: number;
}

export function useContainers() {
  const [containers, setContainers] = useState<ContainerData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [cData, sData, gData] = await Promise.all([
        api.getContainers(),
        api.getStats(),
        api.getGroups(),
      ]);
      setContainers(cData);
      setStats(sData);
      setGroups(gData);
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [fetchData]);

  return { containers, stats, groups, loading, refresh: fetchData };
}
