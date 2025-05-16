"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useSWR from "swr";
import { format } from "date-fns";

interface SignupStat {
  date: string;
  count: number;
}

interface PlanStat {
  id: string;
  name: string;
  count: number;
}

export default function SuperAdminDashboard() {
  const { data: signupStats, isLoading: isLoadingSignups } = useSWR<SignupStat[]>(
    "/api/super-admin/stats/signups"
  );

  const { data: planStats, isLoading: isLoadingPlans } = useSWR<PlanStat[]>(
    "/api/super-admin/stats/plans"
  );

  const chartData = signupStats?.map((stat) => ({
    date: format(new Date(stat.date), "MMM d"),
    signups: stat.count,
  }));

  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your application&apos;s performance
        </p>
      </div>

      {/* Plan Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingPlans ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-12 bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          planStats?.map((stat) => (
            <Card key={stat.id}>
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.count}</div>
                <p className="text-xs text-muted-foreground">
                  Total Organizations
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Signup Graph */}
      <Card>
        <CardHeader>
          <CardTitle>User Signups</CardTitle>
          <CardDescription>
            Daily user registration activity over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {isLoadingSignups ? (
              <div className="h-full w-full animate-pulse bg-muted rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                    allowDecimals={false}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    labelStyle={{
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="signups"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
