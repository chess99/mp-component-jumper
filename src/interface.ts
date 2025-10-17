
export interface Alias {
  name: string;
  path: string;
}

export interface Config {
  ext: string[];
  alias?: Alias[] | ((fileDir: string) => Alias[]);
}
