import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockVisits = [
  { id: 1, date: "2023-10-25", time: "10:00 AM", agent: "Sarah Smith", status: "Completed" },
  { id: 2, date: "2023-10-26", time: "02:00 PM", agent: "Mike Ross", status: "Scheduled" },
  { id: 3, date: "2023-10-28", time: "11:30 AM", agent: "Sarah Smith", status: "Pending" },
];

export function ListingVisits() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Recent Visits</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockVisits.map((visit) => (
              <TableRow key={visit.id}>
                <TableCell className="font-medium text-xs">
                    <div>{visit.date}</div>
                    <div className="text-muted-foreground">{visit.time}</div>
                </TableCell>
                <TableCell className="text-xs">{visit.agent}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={visit.status === "Completed" ? "outline" : "secondary"} className="text-[10px]">
                    {visit.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

