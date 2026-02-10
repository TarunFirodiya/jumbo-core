import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface VisitData {
  id: string;
  scheduledAt: string | Date;
  status: string;
  visitAgent?: {
    fullName: string;
  } | null;
}

interface ListingVisitsProps {
  visits?: VisitData[];
}

export function ListingVisits({ visits = [] }: ListingVisitsProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Recent Visits</CardTitle>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            No visits scheduled
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.map((visit) => {
                const date = new Date(visit.scheduledAt);
                return (
                  <TableRow key={visit.id}>
                    <TableCell className="font-medium text-xs">
                      <div>{date.toLocaleDateString()}</div>
                      <div className="text-muted-foreground">
                        {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {visit.visitAgent?.fullName || "Unassigned"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={visit.status === "completed" ? "outline" : "secondary"}
                        className="text-[10px]"
                      >
                        {visit.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
