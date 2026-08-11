import { useState, useEffect, useCallback } from 'react';
import * as api from '../utils/api';

export interface ContainerData {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  ports: { host_ip: string; host_port: number | null; container_port: number; protocol: string }[];
  compose_project: string | null;
  compose_service: string | null;
  created_at: string | null;
  alias: string | null;
  icon: string | null;
  icon_url: string | null;
  group_name: string | null;
  notes: string | null;
  is_favorite: boolean;
  is_hidden: boolean;
  jump_protocol: string;
  jump_port: number | null;
  private_url: string | null;
  public_url: string | null;
  url_preference: string;
  merge_name: string | null;
  merge_url: string | null;
  sort_order: number;
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
    const [cRes, sRes, gRes] = await Promise.allSettled([
      api.getContainers(),
      api.getStats(),
      api.getGroups(),
    ]);
    if (cRes.status === 'fulfilled') setContainers(cRes.value);
    else console.error('Containers fetch failed:', cRes.reason);
    if (sRes.status === 'fulfilled') setStats(sRes.value);
    if (gRes.status === 'fulfilled') setGroups(gRes.value);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { containers, stats, groups, loading, refresh: fetchData };
}
