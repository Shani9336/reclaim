import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-12 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="font-heading text-3xl font-bold">Privacy Policy</h1>
        </div>
        <p className="text-sm text-muted-foreground">Last updated: September 2024</p>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>
              FoundIt collects item descriptions, photos, locations, and contact details provided when reporting lost or found items.
            </p>
            <p>
              When signing in, we collect your name and email address to maintain your report history and send notifications.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. How Information is Protected</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>
              <strong>Contact Privacy:</strong> Direct contact details (phone and email) are never publicly exposed on item listings. They are only revealed to verified claimants after claim approval by an administrator.
            </p>
            <p>
              <strong>Private Items:</strong> Sensitive items like wallets with ID cards or cash can be marked as Private, making them visible only to institutional admins and matched owners.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. AI Matching Data</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
            <p>
              Item descriptions and attributes are converted to mathematical semantic vectors strictly for finding counterpart items. No personal identifiable information is used for AI model training.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
