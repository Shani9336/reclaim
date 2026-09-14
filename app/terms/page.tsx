import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-12 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-7 w-7 text-primary" />
          <h1 className="font-heading text-3xl font-bold">Terms of Service</h1>
        </div>
        <p className="text-sm text-muted-foreground">Last updated: September 2024</p>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Community Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>
              FoundIt is built on trust and goodwill. Users agree to report genuine lost and found items. Submitting fraudulent reports, spam, or abusive content will result in immediate account suspension.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Claims & Verification</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>
              Submitting an ownership claim requires verifiable proof (serial numbers, invoices, distinctive markings, or photos). Submitting false claims to illicitly acquire items is prohibited and may be reported to institution authorities.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. Handover & Safety</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>
              FoundIt facilitates connections between finders and owners. Physical handover should always occur in designated public security desks, department offices, or station lost-and-found counters.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
