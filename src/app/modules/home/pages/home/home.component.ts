import { Component, HostListener, OnInit } from '@angular/core';
import { RickMortyApiService } from 'src/app/service/rick-morty-api.service';
import { Character } from 'src/app/interfaces/character';
import { catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { FavoritesService } from 'src/app/service/favorites.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  constructor(
    private rickMortyApiService: RickMortyApiService,
    private favoritesService: FavoritesService
  ) {}

  public results: any = [];
  private currentPage: number = 1;
  private lastScrollPosition: number = 0;
  public isFetching: boolean = false;
  public searchTerm: string = '';
  public characters: Array<Character> = [];
  private searchTermChanged: Subject<string> = new Subject<string>();

  ngOnInit(): void {
    this.getCharacters();

    this.searchTermChanged
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((term: string) => {
        this.searchCharacter(term);
      });
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    const currentScrollPosition =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    const isScrollingDown = currentScrollPosition > this.lastScrollPosition;

    if (
      isScrollingDown &&
      !this.isFetching &&
      currentScrollPosition >
        document.documentElement.scrollHeight - window.innerHeight - 300
    ) {
      this.currentPage++;
      this.getCharacters(this.currentPage);
      this.isFetching = true;
    }

    this.lastScrollPosition = currentScrollPosition;
  }

  public getCharacters(page: number = 1) {
    this.isFetching = true;
    this.rickMortyApiService.getCharacters(page).subscribe((response) => {
      this.characters = [...this.characters, ...response];
      this.isFetching = false;
    });
  }

  public searchCharacter(name: string) {
    if (name.trim() !== '' && name.length > 0) {
      this.rickMortyApiService
        .searchCharacter(name)
        .pipe(
          catchError(() => {
            this.characters = [];
            return of([]);
          })
        )
        .subscribe((response) => {
          this.results = response;
          this.characters = this.results.results;
        });
    } else {
      this.currentPage = 1;
      this.characters = [];
      this.getCharacters();
    }
  }

  public isFav(character: Character): boolean {
    let favorites: Character[] = [];
    this.favoritesService
      .getFavorites()
      .subscribe((favs) => (favorites = favs));
    return favorites.some((fav) => fav.id === character.id);
  }

  public updateFav(isFav: boolean, character: Character) {
    if (isFav) {
      this.favoritesService.addFavorite(character);
    } else {
      this.favoritesService.removeFavorite(character);
    }
  }

  public onSearchTermChanged(term: string): void {
    this.searchTermChanged.next(term);
  }
}
