terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

variable "region" {
  description = "Región de AWS para almacenar el estado remoto"
  type        = string
  default     = "us-east-1"
}

variable "proyecto" {
  description = "Prefijo identificador para los recursos"
  type        = string
  default     = "asistencia"
}

# Lista de cuentas autorizadas para asumir el rol (puedes agregar tantas como quieras)
variable "cuentas_colaboradores" {
  description = "Lista de Account IDs de AWS de los compañeros que podrán colaborar"
  type        = list(string)
  default     = [
]
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      proyecto = var.proyecto
      uso      = "terraform-state"
    }
  }
}

# Obtiene la información de TU propia cuenta actual
data "aws_caller_identity" "current" {}

# Generador de sufijo aleatorio para unicidad en S3
resource "random_string" "sufijo" {
  length  = 8
  special = false
  upper   = false
}

# 1. Bucket S3 para almacenar el .tfstate
resource "aws_s3_bucket" "tfstate" {
  bucket        = "${var.proyecto}-tfstate-${random_string.sufijo.result}"
  force_destroy = false

  lifecycle {
    prevent_destroy = true
  }
}

# Versionado en S3
resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Cifrado en reposo (AES256)
resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Bloqueo de acceso público en S3
resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 2. Tabla DynamoDB para el State Locking
resource "aws_dynamodb_table" "tfstate_locks" {
  name         = "${var.proyecto}-tfstate-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

# 3. ROL IAM PARA COLABORADORES MULTI-CUENTA
resource "aws_iam_role" "colaborador" {
  name = "RolTerraformColaborador"

  # Trust relationships (Política de confianza)
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = concat(
            [data.aws_caller_identity.current.arn], # Tu propia cuenta
            [for id in var.cuentas_colaboradores : "arn:aws:iam::${id}:root"] # Cuentas de tus compañeros
          )
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# 4. Asignar AdministratorAccess al Rol
resource "aws_iam_role_policy_attachment" "admin_access" {
  role       = aws_iam_role.colaborador.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# 5. Salidas útiles para copiar en el backend.tf
output "s3_bucket_name" {
  description = "Nombre del bucket S3 para el backend remoto"
  value       = aws_s3_bucket.tfstate.bucket
}

output "dynamodb_table_name" {
  description = "Nombre de la tabla DynamoDB para locking"
  value       = aws_dynamodb_table.tfstate_locks.name
}

output "role_arn" {
  description = "ARN del rol que deben asumir los colaboradores"
  value       = aws_iam_role.colaborador.arn
}

output "region" {
  description = "Región de AWS configurada"
  value       = var.region
}