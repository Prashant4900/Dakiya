class Dakiya < Formula
  desc "Local-first API toolkit — CLI + web dashboard"
  homepage "https://github.com/Prashant4900/Dakiya"
  url "https://github.com/Prashant4900/Dakiya/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "39584b53a440727a170553fddfcb063509dec41d6cbf39281418345d09c54c3b"
  license "MIT"
  head "https://github.com/Prashant4900/Dakiya.git", branch: "main"

  depends_on "node"
  depends_on "pnpm" => :build

  def install
    ENV["npm_config_only_built_dependencies"] = "esbuild,@biomejs/biome"
    system "pnpm", "install", "--config.ignore-scripts=false", "--no-frozen-lockfile"
    system "pnpm", "run", "build"
    libexec.install Dir["*"]
    bin.install_symlink libexec/"dist/cli/cli.js" => "dakiya"
  end

  test do
    assert_match "dakiya", shell_output("#{bin}/dakiya --help")
  end
end
