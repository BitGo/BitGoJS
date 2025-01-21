{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    nixpkgs-nodejs.url = "github:nixos/nixpkgs/de1864217bfa9b5845f465e771e0ecb48b30e02d"; # Node.js 20.18.1
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
          nodejs_20
          (yarn.override { nodejs = nodejs_20; })
        ];

        shellHook = ''
          export PATH="$(pwd)/node_modules/.bin:$PATH"
        '';
      };
    });
  };
}
