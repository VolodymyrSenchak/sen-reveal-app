import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../ui/page-header';

/** The privacy policy the Play listing links to. Keep it in step with what the API stores. */
@Component({
  selector: 'app-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent],
  templateUrl: './privacy.page.html',
  styleUrl: './privacy.page.scss',
})
export class PrivacyPage {
  protected readonly updated = '4 November 2026';
  // TODO: the address people write to for deletion requests; Play shows the developer email publicly too
  protected readonly contactEmail = 'CONTACT_EMAIL';
}
