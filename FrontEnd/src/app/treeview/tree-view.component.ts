import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiService} from '../api.service';
import {ActivatedRoute, Router} from '@angular/router';
import {download} from '../nmrstar/nmrstar';
import {Entry} from '../nmrstar/entry';

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.css']
})
export class TreeViewComponent implements OnInit {
  active: string;
  developerMode: boolean;
  entry: Entry;
  page: string;
  @Input() showInvalidOnly: boolean;
  @Output() sessionEnd = new EventEmitter<boolean>();

  constructor(private api: ApiService,
              private router: Router,
              private route: ActivatedRoute) {
    this.developerMode = false;
    this.page = '?';
  }

  ngOnInit() {

    const parent = this;
    this.router.events.subscribe(() => {
      let r = this.route;
      while (r.firstChild) {
        r = r.firstChild;
      }
      r.params.subscribe(params => {
        if (params['saveframe_description'] !== undefined) {
          parent.active = params['saveframe_description'];
        }
        parent.showInvalidOnly = this.router.url.endsWith('/review');
        const urlSegments = this.router.url.split('/');
        parent.page = urlSegments[urlSegments.length - 1];
      });
    });

    this.api.entrySubject.subscribe(entry => this.entry = entry);
  }

  download(name: string, printable_object): void {
    download(name, printable_object);
  }

  logEntry(): void {
    console.log(this.entry);
  }

  endSession(): void {
    this.api.clearDeposition();
    this.sessionEnd.emit(true);
  }

  refresh(): void {
    this.api.clearDeposition();
    window.location.reload();
  }

  scrollSideNav(): void {
    let element: HTMLElement;
    if (this.page === 'category') {
      element = document.getElementById(this.active);
    } else {
      element = document.getElementById(this.page);
    }
    if (element) {
      element.parentElement.scrollIntoView({behavior: 'smooth'});
    }
  }
}
