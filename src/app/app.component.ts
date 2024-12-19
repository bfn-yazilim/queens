import { Component, HostListener, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { StorageService } from './@core/services/storage.service';
import { LocaleStorageEnum } from './@core/enum/localestorage.enum';
import { GeneralService } from './@core/services/general.service';
import { Board, BoardCell, Game } from './@core/models/Board';
import { DOCUMENT, Location } from '@angular/common';
import { Meta } from '@angular/platform-browser';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  BoardModel: Board = {} as Board;
  firstGameNumber = 1;
  lastGameNumber = 200;
  gameNumber: any;
  isSuccess = false;
  autoX = false;
  message: string;
  lang: string;
  desc: string;
  isEdit = false;
  activeColor: number;
  lstSolution: Game[] = [];
  cachelstSolution: Game[] = [];
  isMobile = false;
  isDownTouch = false;
  isGameList = false;
  activeCell: BoardCell;
  isInstalled = false;
  isSettingsPage = false;

  constructor(
    @Inject(DOCUMENT) private _document: HTMLDocument,
    private _location: Location,
    private metaService: Meta,
    private storage: StorageService,
    private services: GeneralService
  ) { }

  ngOnInit(): void {

    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    //this.WriteSitemap();
    this.cachelstSolution = this.storage.get(LocaleStorageEnum.SOLVED) || [];
    for (let i = this.lastGameNumber; i >= this.firstGameNumber; i--) {
      const isSolved = this.cachelstSolution.find(k => k.Id === i);
      const item = {} as Game;
      item.Id = i;
      item.IsSolution = !!isSolved;
      this.lstSolution.push(item);
    }

    // AutoX

    this.autoX = this.storage.get(LocaleStorageEnum.AUTOX) || false;

    this.isInstalled = window.location.search === '?source=pwa';

    if (window.location.hash !== '') {
      const pathId = window.location.hash.replace('#', '');
      this.gameNumber = Number.parseInt(pathId, 10);
      this.LoadGame();
      this.ChangeMeta();
      return;
    }


    // TODO Silinecek
    //this.storage.set(LocaleStorageEnum.GAME, 22);
    if (this.isEdit) {
      this.BoardModel.Id = 0;
      this.BoardModel.Size = 8;
      this.ChangeSize();
    } else {
      this.gameNumber = this.storage.get(LocaleStorageEnum.GAME);

      if (!this.gameNumber) {
        //this.storage.set(LocaleStorageEnum.GAME, this.lastGameNumber);
        this.gameNumber = this.lastGameNumber;
      }

      this.LoadGame();
    }

  }

  ChangeMeta() {
    this._location.go('#' + this.gameNumber);
    this._document.title = 'Queens Game #' + this.gameNumber;
    this.metaService.updateTag({ name: 'title', content: "Queens Game #" + this.gameNumber });
    this.metaService.updateTag({ name: 'description', content: `Queens No. ${this.gameNumber}` });
    this.metaService.updateTag({ name: 'og:title', content: "Queens Game #" + this.gameNumber });
    this.metaService.updateTag({ name: 'og:description', content: `Queens No. ${this.gameNumber}` });
    this.metaService.updateTag({ name: 'twitter:title', content: "Queens Game #" + this.gameNumber });
    this.metaService.updateTag({ name: 'twitter:description', content: `Queens No. ${this.gameNumber}` });

  }

  WriteSitemap() {
    let urls = '';
    for (let i = this.lastGameNumber; i >= this.firstGameNumber; i--) {
      urls += `
 <url>
 <loc>https://queens.bfn.tr/#${i}</loc>
 <lastmod>${new Date().toISOString()}</lastmod>
 <changefreq>always</changefreq>
 <priority>1.0</priority>
 </url>`;
    }
    const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls}
 </urlset>"`
    console.log(xml);
  }

  ShowSettings() {
    this.isSettingsPage = true;
  }
  CloseSettings() {
    this.isSettingsPage = false;
  }

  ClearCache() {
    this.storage.set(LocaleStorageEnum.SOLVED, []);
    this.cachelstSolution = [];
    this.lstSolution.forEach(v => v.IsSolution = false);
    this.isSettingsPage = false;
  }

  ChangeAutoX() {
    this.storage.set(LocaleStorageEnum.AUTOX, this.autoX);
  }


  // @HostListener('document:click', ['$event'])
  // public onClickListener(event: Event) {
  // }

  // isShowSettingModal = false;
  // OpenSettings() {
  //   this.isShowSettingModal = true;
  // }

  // CloseSettings() {
  //   this.isShowSettingModal = false;
  // }

  CalcCoordinates() {
    this.isSuccess = false;
    try {
      setTimeout(() => {
        const elem = document.querySelectorAll(".cell");

        if (elem.length === 0) {
          return this.CalcCoordinates();
        }

        for (let i = 0; i < elem.length; i++) {
          const element = elem[i];
          const rect = element.getBoundingClientRect();
          let cor = element.classList[0];
          cor = cor.replace('cor_', '');
          const lstIndex = cor.split('_');
          if (lstIndex.length > 0) {

            this.BoardModel.Colors[lstIndex[0]][lstIndex[1]].ScreenX = rect.left;
            this.BoardModel.Colors[lstIndex[0]][lstIndex[1]].ScreenXMax = rect.right;
            this.BoardModel.Colors[lstIndex[0]][lstIndex[1]].ScreenY = rect.top;
            this.BoardModel.Colors[lstIndex[0]][lstIndex[1]].ScreenYMax = rect.bottom;
          }
        }

      }, 1000);
    } catch (error) {
      return this.CalcCoordinates();
    }

  }

  ShowGameList() {
    this.isGameList = true;
  }

  HideGameList() {
    this.isGameList = false;
  }

  //@HostListener('touchstart', ['$event'])
  @HostListener('touchmove', ['$event'])
  //@HostListener('touchcancel', ['$event'])
  handleTouch(event) {
    if (this.isSuccess) {
      return;
    }
    const touch = event.touches[0] || event.changedTouches[0];

    for (let i = 0; i < this.BoardModel.Colors.length; i++) {
      const element = this.BoardModel.Colors[i].find(k =>
        k.ScreenX <= touch.clientX && touch.clientX <= k.ScreenXMax
        && k.ScreenY <= touch.clientY && touch.clientY <= k.ScreenYMax);

      if (element) {
        if (element.isCheck === 0) {
          element.isCheck = 1;
        }

        this.SetAutoX(element);
      }

      this.IsSuccess();
    }

  }

  @HostListener('touchstart', ['$event'])
  handleTouchStart(event) {
    if (this.isSuccess) {
      return;
    }
    this.isDownTouch = true;
    const touch = event.touches[0] || event.changedTouches[0];

    for (let i = 0; i < this.BoardModel.Colors.length; i++) {
      const element = this.BoardModel.Colors[i].find(k =>
        k.ScreenX <= touch.clientX && touch.clientX <= k.ScreenXMax
        && k.ScreenY <= touch.clientY && touch.clientY <= k.ScreenYMax);


      if (element) {
        element.isCheck++;
        if (element.isCheck === 3) {
          element.isCheck = 0;
        }


        this.SetAutoX(element);

        this.IsSuccess();
      }
    }

  }

  SetAutoX(item: BoardCell) {
    if (!this.autoX) {
      return;
    }

    if (item.isCheck === 2) {
      this.activeCell = item;

      // Auto X Clear
      for (let i = 0; i < this.BoardModel.Colors.length; i++) {
        for (let ii = 0; ii < this.BoardModel.Colors[i].length; ii++) {
          this.BoardModel.Colors[i][ii].IsAutoCheck = false;
        }
      }


      // aynı renkleri işaretle
      for (let i = 0; i < this.BoardModel.Colors.length; i++) {
        for (let ii = 0; ii < this.BoardModel.Colors[i].length; ii++) {
          if (this.BoardModel.Colors[i][ii].isCheck == 0 && this.BoardModel.Colors[i][ii].color == item.color) {
            this.BoardModel.Colors[i][ii].isCheck = 1;
            this.BoardModel.Colors[i][ii].IsAutoCheck = true;
          }
        }
      }

      // satır işaretle
      for (let ii = 0; ii < this.BoardModel.Colors[item.row].length; ii++) {
        if (this.BoardModel.Colors[item.row][ii].isCheck == 0) {
          this.BoardModel.Colors[item.row][ii].isCheck = 1;
          this.BoardModel.Colors[item.row][ii].IsAutoCheck = true;
        }
      }

      // sütun işaretle
      for (let ii = 0; ii < this.BoardModel.Colors.length; ii++) {
        if (this.BoardModel.Colors[ii][item.column].isCheck == 0) {
          this.BoardModel.Colors[ii][item.column].isCheck = 1;
          this.BoardModel.Colors[ii][item.column].IsAutoCheck = true;
        }

      }
      // etrafını işaretle
      if (!!this.BoardModel.Colors[item.row - 1] && this.BoardModel.Colors[item.row - 1][item.column - 1]?.isCheck == 0) {
        this.BoardModel.Colors[item.row - 1][item.column - 1].isCheck = 1;
        this.BoardModel.Colors[item.row - 1][item.column - 1].IsAutoCheck = true;
      }

      if (!!this.BoardModel.Colors[item.row - 1] && this.BoardModel.Colors[item.row - 1][item.column + 1]?.isCheck == 0) {
        this.BoardModel.Colors[item.row - 1][item.column + 1].isCheck = 1;
        this.BoardModel.Colors[item.row - 1][item.column + 1].IsAutoCheck = true;
      }

      if (!!this.BoardModel.Colors[item.row + 1] && this.BoardModel.Colors[item.row + 1][item.column - 1]?.isCheck == 0) {
        this.BoardModel.Colors[item.row + 1][item.column - 1].isCheck = 1;
        this.BoardModel.Colors[item.row + 1][item.column - 1].IsAutoCheck = true;
      }

      if (!!this.BoardModel.Colors[item.row + 1] && this.BoardModel.Colors[item.row + 1][item.column + 1]?.isCheck == 0) {
        this.BoardModel.Colors[item.row + 1][item.column + 1].isCheck = 1;
        this.BoardModel.Colors[item.row + 1][item.column + 1].IsAutoCheck = true;
      }
    }
    else if (item.isCheck === 0) {
      if (this.activeCell && this.activeCell.row === item.row && this.activeCell.column === item.column) {

        this.BackSetAutoX(item);
      }
    }
  }

  BackSetAutoX(item: BoardCell) {
    if (item.isCheck === 0 && this.autoX) {

      // Auto X Clear
      for (let i = 0; i < this.BoardModel.Colors.length; i++) {
        for (let ii = 0; ii < this.BoardModel.Colors[i].length; ii++) {
          if (this.BoardModel.Colors[i][ii].IsAutoCheck) {
            this.BoardModel.Colors[i][ii].IsAutoCheck = false;
            this.BoardModel.Colors[i][ii].isCheck = 0;
          }
        }
      }
    }
  }


  GoGame(id: number) {
    this.gameNumber = id;
    this.LoadGame();
    this.ChangeMeta();
    this.HideGameList();
  }

  isDownMouse = false;
  DownEvent(item: BoardCell) {
    if (this.isMobile) {
      return;
    }
    if (item.isCheck === 0) {
      item.isCheck = 1;
      this.isDownMouse = true;
    }
    else {
      this.isDownMouse = false;
      item.isCheck++;
      if (item.isCheck === 3) {
        item.isCheck = 0;
      }

      this.SetAutoX(item);
      this.IsSuccess();
    }
  }

  UpEvent(item: BoardCell) {
    if (this.isMobile) {
      return;
    }
    this.isDownMouse = false;
    // item.isCheck++;
    // if (item.isCheck == 3) {
    //   item.isCheck = 0;
    // }
    // this.IsSuccess();

    // if (this.isSuccess) {
    //   this.lstSolution.find(i => i.Id == this.BoardModel.Id).IsSolution = true;
    //   const lst = this.lstSolution.filter(i => i.IsSolution === true);
    //   this.storage.set(LocaleStorageEnum.SOLVED, lst);
    // }

  }

  OverEvent(item: BoardCell) {
    if (this.isMobile) {
      return;
    }
    if (this.isDownMouse && item.isCheck === 0) {
      item.isCheck = 1;
    }
  }

  // TouchStart(item: BoardCell) {
  //   //this.isDownTouch = true;
  // }

  // TouchMove(item: BoardCell) {
  //   //if (this.isDownTouch && item.isCheck === 0) {
  //   //  item.isCheck = 1;
  //   //}
  // }

  // TouchEnd(item: BoardCell) {
  //   //this.isDownTouch = false;
  //   // item.isCheck++;
  //   // if (item.isCheck === 3) {
  //   //   item.isCheck = 0;
  //   // }

  // }


  Check(item: BoardCell) {
    this.isDownMouse = false;

    item.isCheck++

    if (item.isCheck == 3) {
      item.isCheck = 0;
    }
    this.SetAutoX(item);
    this.IsSuccess();
  }

  IsSuccess() {
    this.IsError();
    for (let i = 0; i < this.BoardModel.Colors.length; i++) {
      for (let a = 0; a < this.BoardModel.Colors[i].length; a++) {
        if (this.BoardModel.Colors[i][a].isQueen && this.BoardModel.Colors[i][a].isCheck !== 2) {
          return;
        }
      }
    }

    setTimeout(() => {

      const lstSvg = this._document.querySelectorAll('.queens-icon-svg');

      for (let i = 0; i < lstSvg.length; i++) {
        lstSvg[i].classList.remove('pulse');
        setTimeout(() => {
          lstSvg[i].classList.add('pulse');
        }, 300 * i);
      }

      this.lstSolution.find(i => i.Id == this.BoardModel.Id).IsSolution = true;
      const lst = this.lstSolution.filter(i => i.IsSolution === true);
      this.storage.set(LocaleStorageEnum.SOLVED, lst);

      setTimeout(() => {
        this.isSuccess = true;
      }, 300 * (lstSvg.length + 1));

    }, 300);


  }

  IsError() {
    for (let i = 0; i < this.BoardModel.Colors.length; i++) {
      for (let a = 0; a < this.BoardModel.Colors[i].length; a++) {
        this.BoardModel.Colors[i][a].isError = false;
      }
    }

    // Yatay Kontrol
    for (let i = 0; i < this.BoardModel.Colors.length; i++) {
      let errorCount = 0;
      for (let a = 0; a < this.BoardModel.Colors[i].length; a++) {
        if (this.BoardModel.Colors[i][a].isCheck === 2) {
          errorCount++;
        }
      }
      if (errorCount > 1) {
        for (let a = 0; a < this.BoardModel.Colors[i].length; a++) {
          this.BoardModel.Colors[i][a].isError = true;
        }
        return;
      }
    }

    // Dikey Kontrol
    for (let i = 0; i < this.BoardModel.Colors.length; i++) {
      let errorCount = 0;
      for (let a = 0; a < this.BoardModel.Colors[i].length; a++) {
        if (this.BoardModel.Colors[a][i].isCheck === 2) {
          errorCount++;
        }
      }


      if (errorCount > 1) {
        for (let a = 0; a < this.BoardModel.Colors[i].length; a++) {
          this.BoardModel.Colors[a][i].isError = true;
        }
        return;
      }
    }


    for (let i = 0; i < this.BoardModel.Colors.length; i++) {
      for (let a = 0; a < this.BoardModel.Colors[i].length; a++) {
        const item = this.BoardModel.Colors[i][a];
        if (item.isCheck != 2) {
          continue;
        }
        if (!!this.BoardModel.Colors[item.row - 1] && this.BoardModel.Colors[item.row - 1][item.column - 1]?.isCheck == 2) {
          this.BoardModel.Colors[item.row - 1][item.column - 1].isError = true;
        }

        if (!!this.BoardModel.Colors[item.row - 1] && this.BoardModel.Colors[item.row - 1][item.column + 1]?.isCheck == 2) {
          this.BoardModel.Colors[item.row - 1][item.column + 1].isError = true;
        }

        if (!!this.BoardModel.Colors[item.row + 1] && this.BoardModel.Colors[item.row + 1][item.column - 1]?.isCheck == 2) {
          this.BoardModel.Colors[item.row + 1][item.column - 1].isError = true;

        }

        if (!!this.BoardModel.Colors[item.row + 1] && this.BoardModel.Colors[item.row + 1][item.column + 1]?.isCheck == 2) {
          this.BoardModel.Colors[item.row + 1][item.column + 1].isError = true;
        }
      }
    }


  }

  ClearGame() {
    for (let i = 0; i < this.BoardModel.Colors.length; i++) {
      for (let a = 0; a < this.BoardModel.Colors[i].length; a++) {
        this.BoardModel.Colors[i][a].isCheck = 0;
        this.BoardModel.Colors[i][a].isError = false;
      }
    }
    this.isSuccess = false;
    this.isActiveHintButton = true;
  }

  Next() {
    this.gameNumber--;
    this.isActiveHintButton = true;

    this.LoadGame();
    this.ChangeMeta();
  }

  Reset() {
    this.gameNumber = this.lastGameNumber;
    this.isActiveHintButton = true;
    this.isSuccess = false;
    this.message = null;

    this.LoadGame();
    this.ChangeMeta();
  }

  isActiveHintButton = true;

  Hint() {
    let isHint = true;
    let count = 0;
    while (isHint) {
      if (count > 100) {
        isHint = false;
        this.isActiveHintButton = false;
        break;
      }
      const random = Math.floor(Math.random() * this.BoardModel.Colors.length);
      const random2 = Math.floor(Math.random() * this.BoardModel.Colors.length);
      if (this.BoardModel.Colors[random][random2].isCheck === 0 && !this.BoardModel.Colors[random][random2].isQueen) {
        this.BoardModel.Colors[random][random2].isCheck = 1;
        count++;
        isHint = false;
        this.DisableHintButton();
      }
    }

    // for (let i = 0; i < this.BoardModel.Colors.length; i++) {
    //   for (let a = 0; a < this.BoardModel.Colors[i].length; a++) {
    //     if (this.BoardModel.Colors[i][a].isQueen && this.BoardModel.Colors[i][a].isCheck !== 2) {
    //       this.BoardModel.Colors[i][a].isCheck = 2;
    //       this.IsSuccess();
    //       return;
    //     }
    //   }
    // }
  }

  DisableHintButton() {
    let count = 0;
    for (let i = 0; i < this.BoardModel.Colors.length; i++) {
      for (let a = 0; a < this.BoardModel.Colors[i].length; a++) {
        if (!this.BoardModel.Colors[i][a].isQueen && this.BoardModel.Colors[i][a].isCheck !== 1) {
          //this.BoardModel.Colors[i][a].isCheck = 2;
          count++;
        }
      }
    }
    if (count == 0) {
      this.isActiveHintButton = false;
    }
  }

  ChangeSize() {

    this.BoardModel.Colors = [];


    for (let i = 0; i < this.BoardModel.Size; i++) {
      const row = [];
      for (let i = 0; i < this.BoardModel.Size; i++) {
        const cell = {} as BoardCell;
        cell.color = 0;
        cell.isCheck = 0;
        cell.isQueen = false;
        row.push(cell);
      }
      this.BoardModel.Colors.push(row);
    }
  }

  SetColor(item: number) {
    this.activeColor = item;
  }

  SetCellColor(item: BoardCell) {
    if (this.activeColor === 99) {
      item.isQueen = !item.isQueen;
    }
    else {
      item.color = this.activeColor;
    }
  }


  isDownMouseSet = false;
  DownEventSetCell(item: BoardCell) {
    if (this.isMobile) {
      return;
    }

    if (this.activeColor === 99) {
      item.isQueen = !item.isQueen;
    }
    else {
      item.color = this.activeColor;
    }
    this.isDownMouseSet = true;
  }

  UpEventSetCell() {
    if (this.isMobile) {
      return;
    }
    this.isDownMouseSet = false;
  }

  OverEventSetCell(item: BoardCell) {
    if (this.isMobile) {
      return;
    }

    if (this.isDownMouseSet) {
      if (this.activeColor === 99) {
        item.isQueen = !item.isQueen;
      }
      else {
        item.color = this.activeColor;
      }
    }
  }



  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {

    if (event.key == 'L') {
      // Your row selection code
      if (this.isEdit) {
        this.gameNumber = this.storage.get(LocaleStorageEnum.GAME);
        if (!this.gameNumber) {
          this.gameNumber = this.lastGameNumber;
        }

        this.LoadGame();
        this.ChangeMeta();
      }
      else {
        this.BoardModel.Id = 0;
        this.BoardModel.Size = 8;
        this.ChangeSize();
      }
      this.isEdit = !this.isEdit;
    }
  }

  Save() {
    this.writeContents(JSON.stringify(this.BoardModel), this.BoardModel.Id + '.json', 'text/plain');
  }

  writeContents(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }

  RandomGame() {

    let game = { IsSolution: true } as Game;

    const lstUnPlayedGame = this.lstSolution.filter(s => s.IsSolution === false);
    if (lstUnPlayedGame.length === 0) {
      this.gameNumber = this.RandomNumber(this.firstGameNumber, this.lastGameNumber);
      this.LoadGame();
      this.ChangeMeta();
    }

    while (game.IsSolution) {
      this.gameNumber = this.RandomNumber(this.firstGameNumber, this.lastGameNumber);
      game = this.lstSolution.find(k => k.Id === this.gameNumber);
    }
    this.LoadGame();
    this.ChangeMeta();
  }

  RandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  LoadGame() {
    if (this.gameNumber < this.firstGameNumber) {
      this.gameNumber = this.lastGameNumber;
    }
    this.storage.set(LocaleStorageEnum.GAME, this.gameNumber);
    this.message = null;
    this.services.Get(`assets/data/${this.gameNumber}.json`).then((data: Board) => {

      let id = 0;
      for (let i = 0; i < data.Colors.length; i++) {
        for (let a = 0; a < data.Colors[i].length; a++) {
          id++;
          data.Colors[i][a].id = id;
          data.Colors[i][a].row = i;
          data.Colors[i][a].column = a;
          data.Colors[i][a].isCheck = 0;
          data.Colors[i][a].isError = false;
          data.Colors[i][a].ScreenX = 0;
          data.Colors[i][a].ScreenY = 0;
          data.Colors[i][a].ScreenXMax = 0;
          data.Colors[i][a].ScreenYMax = 0;
          data.Colors[i][a].IsAutoCheck = false;
          data.Colors[i][a].BorderTop = false;
          data.Colors[i][a].BorderRight = false;

        }
      }
      data.IsSolved = this.cachelstSolution.some(k => k.Id === this.gameNumber);
      this.BoardModel = data;
      this.MakeBorder();
      this.isSuccess = false;

    }).catch(err => {
      this.message = 'Error: ' + JSON.stringify(err);
    });

    this.CalcCoordinates();

  }

  MakeBorder() {
    for (let row = 0; row < this.BoardModel.Colors.length; row++) {
      for (let col = 0; col < this.BoardModel.Colors[row].length; col++) {
        // left border check
        if (col !== this.BoardModel.Colors.length - 1 && this.BoardModel.Colors[row][col + 1]?.color !== this.BoardModel.Colors[row][col].color) {
          this.BoardModel.Colors[row][col].BorderRight = true;
        }

        // top border check
        if (row !== 0 && this.BoardModel.Colors[row - 1] && this.BoardModel.Colors[row - 1][col]?.color !== this.BoardModel.Colors[row][col].color) {
          this.BoardModel.Colors[row][col].BorderTop = true;
        }
      }
    }
  }
}
