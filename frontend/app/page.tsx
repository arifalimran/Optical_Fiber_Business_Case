import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FolderKanban, 
  Users, 
  Calendar 
} from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Projects",
      value: "12",
      change: "+2 from last month",
      trend: "up",
      icon: FolderKanban,
    },
    {
      title: "Active Budget",
      value: "৳45.2M",
      change: "৳12.5M remaining",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Team Members",
      value: "48",
      change: "+6 this quarter",
      trend: "up",
      icon: Users,
    },
    {
      title: "Projects on Schedule",
      value: "9/12",
      change: "75% completion rate",
      trend: "down",
      icon: Calendar,
    },
  ];

  const recentProjects = [
    {
      name: "Dhaka Metro Fiber Network",
      location: "Dhaka",
      length: "30,000m",
      status: "In Progress",
      progress: 65,
    },
    {
      name: "Chittagong Coastal Link",
      location: "Chittagong",
      length: "45,000m",
      status: "Planning",
      progress: 25,
    },
    {
      name: "Sylhet City Expansion",
      location: "Sylhet",
      length: "18,000m",
      status: "In Progress",
      progress: 80,
    },
    {
      name: "Rajshahi Ring Network",
      location: "Rajshahi",
      length: "22,000m",
      status: "Completed",
      progress: 100,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your optical fiber projects and business metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-orange-600" />
                  )}
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Projects */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>
              Overview of ongoing and completed fiber optic installations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.name}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.location} • {project.length}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          project.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : project.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {project.progress}% complete
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Frequently used tools and calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <button className="flex flex-col items-start gap-2 rounded-lg border p-4 hover:bg-accent transition-colors">
              <FolderKanban className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">New Project</p>
                <p className="text-xs text-muted-foreground">
                  Create a new fiber project
                </p>
              </div>
            </button>
            <button className="flex flex-col items-start gap-2 rounded-lg border p-4 hover:bg-accent transition-colors">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Cost Calculator</p>
                <p className="text-xs text-muted-foreground">
                  Calculate project costs
                </p>
              </div>
            </button>
            <button className="flex flex-col items-start gap-2 rounded-lg border p-4 hover:bg-accent transition-colors">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Team Management</p>
                <p className="text-xs text-muted-foreground">
                  Manage your team
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

