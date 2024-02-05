locals {
    cinemas_data = jsondecode(file("${path.module}/cinemas.json"))
    cinemas      = tomap(local.cinemas_data)
}