Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath {
  param(
    [float] $X,
    [float] $Y,
    [float] $Width,
    [float] $Height,
    [float] $Radius
  )

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Add-ScaledPolygon {
  param(
    [System.Drawing.Graphics] $Graphics,
    [System.Drawing.Brush] $Brush,
    [float] $Scale,
    [float[]] $Points
  )

  $drawingPoints = @()
  for ($i = 0; $i -lt $Points.Length; $i += 2) {
    $drawingPoints += [System.Drawing.PointF]::new($Points[$i] * $Scale, $Points[$i + 1] * $Scale)
  }
  $Graphics.FillPolygon($Brush, $drawingPoints)
}

function New-AppIcon {
  param(
    [int] $Size,
    [string] $Path
  )

  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $scale = $Size / 512
  $rect = [System.Drawing.RectangleF]::new(0, 0, $Size, $Size)
  $bg = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 255, 157, 108),
    [System.Drawing.Color]::FromArgb(255, 76, 125, 255),
    135
  )
  $radius = 112 * $scale
  $bgPath = New-RoundedRectPath 0 0 $Size $Size $radius
  $graphics.FillPath($bg, $bgPath)

  $softBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(44, 255, 253, 248))
  $graphics.FillEllipse($softBrush, 92 * $scale, 112 * $scale, 328 * $scale, 328 * $scale)

  $carBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 253, 248))
  $windowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 220, 234, 255))
  $inkBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 29, 36, 48))
  $heartBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 122, 89))

  $carPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $carPath.AddPolygon(@(
    [System.Drawing.PointF]::new(104 * $scale, 316 * $scale),
    [System.Drawing.PointF]::new(136 * $scale, 240 * $scale),
    [System.Drawing.PointF]::new(164 * $scale, 204 * $scale),
    [System.Drawing.PointF]::new(206 * $scale, 188 * $scale),
    [System.Drawing.PointF]::new(306 * $scale, 188 * $scale),
    [System.Drawing.PointF]::new(348 * $scale, 204 * $scale),
    [System.Drawing.PointF]::new(376 * $scale, 240 * $scale),
    [System.Drawing.PointF]::new(408 * $scale, 316 * $scale),
    [System.Drawing.PointF]::new(408 * $scale, 386 * $scale),
    [System.Drawing.PointF]::new(104 * $scale, 386 * $scale)
  ))
  $graphics.FillPath($carBrush, $carPath)
  $graphics.FillPolygon($windowBrush, @(
    [System.Drawing.PointF]::new(178 * $scale, 276 * $scale),
    [System.Drawing.PointF]::new(200 * $scale, 222 * $scale),
    [System.Drawing.PointF]::new(312 * $scale, 222 * $scale),
    [System.Drawing.PointF]::new(334 * $scale, 276 * $scale)
  ))
  $graphics.FillEllipse($inkBrush, 175 * $scale, 356 * $scale, 50 * $scale, 50 * $scale)
  $graphics.FillEllipse($inkBrush, 287 * $scale, 356 * $scale, 50 * $scale, 50 * $scale)

  $heartPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $heartPath.AddBezier(256 * $scale, 380 * $scale, 208 * $scale, 350 * $scale, 220 * $scale, 304 * $scale, 256 * $scale, 324 * $scale)
  $heartPath.AddBezier(256 * $scale, 324 * $scale, 292 * $scale, 304 * $scale, 304 * $scale, 350 * $scale, 256 * $scale, 380 * $scale)
  $heartPath.CloseFigure()
  $graphics.FillPath($heartBrush, $heartPath)

  $directory = Split-Path -Parent $Path
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

  $graphics.Dispose()
  $bitmap.Dispose()
}

New-AppIcon 180 "assets/apple-touch-icon.png"
New-AppIcon 192 "assets/icon-192.png"
New-AppIcon 512 "assets/icon-512.png"
