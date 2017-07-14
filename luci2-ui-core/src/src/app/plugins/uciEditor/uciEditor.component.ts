import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-uci-editor',
  templateUrl: './uciEditor.component.html',
  styleUrls: ['./uciEditor.component.css']
})
export class UciEditorComponent implements OnInit {
  public selectedConfig: string;


  constructor() { }

  ngOnInit() {
  }

}
