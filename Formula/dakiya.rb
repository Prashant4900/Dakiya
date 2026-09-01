class Dakiya < Formula
  desc "Local-first API toolkit — CLI + web dashboard"
  homepage "https://github.com/Prashant4900/Dakiya"
  url "https://github.com/Prashant4900/Dakiya/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "PLACEHOLDER_SHA256"
  license "MIT"
  head "https://github.com/Prashant4900/Dakiya.git", branch: "main"

  depends_on "node"
  depends_on "pnpm" => :build

  def install
    system "pnpm", "install", "--frozen-lockfile"
    system "pnpm", "run", "build"
    libexec.install Dir["*"]
    bin.install_symlink libexec/"dist/cli/cli.js" => "dakiya"
  end

  test do
    assert_match "dakiya", shell_output("#{bin}/dakiya --help")
  end
end
