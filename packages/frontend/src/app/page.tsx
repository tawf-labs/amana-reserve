// Copyright 2026 TAWF Labs
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HAIChart } from '@/components/dashboard/hai-chart';
import { Activity, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  // Mock data - would be fetched from SDK/API
  const stats = {
    totalCapital: '12,450 ETH',
    participantCount: 127,
    activityCount: 43,
    haiScore: 7200,
  };

  const recentActivities = [
    {
      id: '0x1234...5678',
      type: 'Trade',
      capital: '500 ETH',
      status: 'Completed',
      outcome: '+45 ETH',
    },
    {
      id: '0xabcd...efgh',
      type: 'Manufacturing',
      capital: '1,200 ETH',
      status: 'Active',
      outcome: '-',
    },
    {
      id: '0x9876...5432',
      type: 'Agriculture',
      capital: '300 ETH',
      status: 'Proposed',
      outcome: '-',
    },
  ];

  const topParticipants = [
    { address: '0x742d...35Cc', contribution: '2,500 ETH', activities: 8 },
    { address: '0x3B9a...1Dc4', contribution: '1,800 ETH', activities: 5 },
    { address: '0x8F21...9Ab7', contribution: '1,200 ETH', activities: 3 },
    { address: '0x1C5d...6Ef9', contribution: '900 ETH', activities: 2 },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-semibold text-neutral-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Overview of the AMANA Sharia-native reserve system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="bento-grid mb-8">
        {/* Total Capital */}
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Total Capital
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
              {stats.totalCapital}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              <span className="text-success-600">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Participants
            </CardTitle>
            <Users className="h-4 w-4 text-primary-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
              {stats.participantCount}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              <span className="text-success-600">+8</span> this week
            </p>
          </CardContent>
        </Card>

        {/* Active Activities */}
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Active Activities
            </CardTitle>
            <Activity className="h-4 w-4 text-primary-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
              {stats.activityCount}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Across all sectors
            </p>
          </CardContent>
        </Card>

        {/* HAI Score */}
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              HAI Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
              {stats.haiScore / 100}%
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              <span className="text-success-600">High</span> compliance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* HAI Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Halal Activity Index</CardTitle>
          <CardDescription>
            Real-time Sharia compliance tracking and historical trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HAIChart />
        </CardContent>
      </Card>

      {/* Recent Activities & Top Participants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest economic activities in the reserve</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capital</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-mono text-xs">{activity.id}</TableCell>
                    <TableCell>{activity.type}</TableCell>
                    <TableCell>{activity.capital}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          activity.status === 'Completed'
                            ? 'success'
                            : activity.status === 'Active'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {activity.status}
                      </Badge>
                    </TableCell>
                    <TableCell className={activity.outcome.startsWith('+') ? 'text-success-600' : ''}>
                      {activity.outcome}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Top Participants</CardTitle>
            <CardDescription>Leading contributors by capital staked</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Contribution</TableHead>
                  <TableHead>Activities</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topParticipants.map((participant, index) => (
                  <TableRow key={participant.address}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">#{index + 1}</span>
                        <span className="font-mono text-xs">{participant.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>{participant.contribution}</TableCell>
                    <TableCell>{participant.activities}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
