{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    # Node 22 is intentional here: the dev shell mirrors the BitGo Express
    # runtime major, while the root .nvmrc pins the separate Node 24 SDK
    # toolchain. Keep the two decisions independent.
    nixpkgs-nodejs.url = "github:nixos/nixpkgs/8bd525757851975db0aebe3af18073b7f52d6f34"; # Node.js 22.23.4
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
