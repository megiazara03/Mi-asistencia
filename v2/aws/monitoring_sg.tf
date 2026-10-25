# -----------------------------------------------------------------------------
# Reglas de Monitoreo: Prometheus (9090), Grafana (3000) y Node Exporter (9100)
# -----------------------------------------------------------------------------

# Grafana (puerto 3000) accesible desde tu IP
resource "aws_vpc_security_group_ingress_rule" "grafana" {
  security_group_id = aws_security_group.backend.id
  description       = "Grafana Dashboard"
  ip_protocol       = "tcp"
  from_port         = 3000
  to_port           = 3000
  cidr_ipv4         = var.mi_ip
}

# Prometheus (puerto 9090) accesible desde tu IP
resource "aws_vpc_security_group_ingress_rule" "prometheus" {
  security_group_id = aws_security_group.backend.id
  description       = "Prometheus Server"
  ip_protocol       = "tcp"
  from_port         = 9090
  to_port           = 9090
  cidr_ipv4         = var.mi_ip
}

# Node Exporter en backend (puerto 9100) accesible localmente por Prometheus
resource "aws_vpc_security_group_ingress_rule" "node_exporter_backend" {
  security_group_id = aws_security_group.backend.id
  description       = "Node Exporter Backend"
  ip_protocol       = "tcp"
  from_port         = 9100
  to_port           = 9100
  cidr_ipv4         = "127.0.0.1/32"
}

# Node Exporter en frontend (puerto 9100) accesible desde el backend (por red privada)
resource "aws_security_group_rule" "frontend_node_exporter" {
  count                    = var.crear_frontend ? 1 : 0
  type                     = "ingress"
  from_port                = 9100
  to_port                  = 9100
  protocol                 = "tcp"
  security_group_id        = aws_security_group.frontend[0].id
  source_security_group_id = aws_security_group.backend.id
  description              = "Node Exporter accesible desde el servidor Prometheus (Backend)"
}
