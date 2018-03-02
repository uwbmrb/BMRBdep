import { Component, OnInit, Input } from '@angular/core';
import { ApiService } from '../api.service';
import { Tag } from '../nmrstar/tag';

@Component({
  selector: 'app-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.css']
})
export class TagComponent implements OnInit {
  @Input() tag: Tag;

  constructor(public api: ApiService) { }

  ngOnInit() {
  }

  validateTag(tag: Tag) {
    tag.updateTagStatus();
    this.api.saveLocal();
  }
  
}
