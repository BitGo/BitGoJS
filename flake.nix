{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    nixpkgs-nodejs.url = "github:nixos/nixpkgs/6ad174a6dc07c7742fc64005265addf87ad08615"; # Node.js 22.14.0
  };

  outputs = {
    self,
    nixpkgs,
    nixpkgs-nodejs,
  }: let
    forEachSystem = nixpkgs.lib.genAttrs [
      "aarch64-darwin"
      "aarch64-linux"
      "x86_64-darwin"
      "x86_64-linux"
    ];
  in {
    devShells = forEachSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      default = pkgs.mkShell {
        packages = with nixpkgs-nodejs.legacyPackages.${system}; [
          nodejs_22
          (yarn.override { nodejs = nodejs_22; })
        ];

        shellHook = ''
          export PATH="$(pwd)/node_modules/.bin:$PATH"
        '';
      };
    });
  };
}
