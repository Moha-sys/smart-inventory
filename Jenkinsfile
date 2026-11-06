pipeline {
    agent any

    environment {
        // =====================================================================
        // Docker Hub & Jenkins Configuration (sourced from Lab 22)
        // Docker Hub User: mohadevv
        // Jenkins Credentials ID: docker
        // =====================================================================
        DOCKERHUB_USERNAME       = 'mohadevv'
        DOCKERHUB_CREDENTIALS_ID = 'docker'

        CLIENT_IMAGE             = "${DOCKERHUB_USERNAME}/smart-inventory-client"
        SERVER_IMAGE             = "${DOCKERHUB_USERNAME}/smart-inventory-server"
        WORKER_IMAGE             = "${DOCKERHUB_USERNAME}/smart-inventory-worker"
        IMAGE_TAG                = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout SCM') {
            steps {
                echo "Fetching latest source code from Git repository..."
                checkout scm
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    echo "============================================================"
                    echo "Building Docker Images (Tags: ${IMAGE_TAG} and latest)"
                    echo "============================================================"

                    // Build Frontend (client)
                    echo "Building Frontend (Client)..."
                    sh """
                        docker build -t ${CLIENT_IMAGE}:${IMAGE_TAG} -t ${CLIENT_IMAGE}:latest ./frontend
                    """

                    // Build Backend (server / inventory-service)
                    echo "Building Backend (Server)..."
                    sh """
                        docker build -t ${SERVER_IMAGE}:${IMAGE_TAG} -t ${SERVER_IMAGE}:latest ./inventory-service
                    """

                    // Build Alert Worker (worker / alert-service)
                    echo "Building Alert Worker (Worker)..."
                    sh """
                        docker build -t ${WORKER_IMAGE}:${IMAGE_TAG} -t ${WORKER_IMAGE}:latest ./alert-service
                    """
                }
            }
        }

        stage('Push to Docker Registry') {
            steps {
                script {
                    echo "============================================================"
                    echo "Authenticating and Pushing Images to Docker Hub..."
                    echo "============================================================"
                    withCredentials([usernamePassword(
                        credentialsId: "${DOCKERHUB_CREDENTIALS_ID}",
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh """
                            echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin

                            docker push ${CLIENT_IMAGE}:${IMAGE_TAG}
                            docker push ${CLIENT_IMAGE}:latest

                            docker push ${SERVER_IMAGE}:${IMAGE_TAG}
                            docker push ${SERVER_IMAGE}:latest

                            docker push ${WORKER_IMAGE}:${IMAGE_TAG}
                            docker push ${WORKER_IMAGE}:latest
                        """
                    }
                }
            }
        }

        stage('Update & Deploy to Kubernetes via Ansible') {
            steps {
                script {
                    echo "============================================================"
                    echo "Executing Ansible Playbook to Deploy and Roll Out Pods..."
                    echo "============================================================"
                    sh """
                        ansible-playbook -i ansible/inventory.ini ansible/playbooks/deploy-k8s.yml \
                            --extra-vars "image_tag=${IMAGE_TAG} dockerhub_username=${DOCKERHUB_USERNAME}"
                    """
                }
            }
        }

        stage('Verify Rollout') {
            steps {
                script {
                    echo "============================================================"
                    echo "Verifying Rollout Status and Running Pods..."
                    echo "============================================================"
                    sh """
                        kubectl rollout status deployment/postgres-deployment --timeout=120s
                        kubectl rollout status deployment/server-deployment --timeout=120s
                        kubectl rollout status deployment/worker-deployment --timeout=120s
                        kubectl rollout status deployment/client-deployment --timeout=120s

                        echo "--- Current Pods ---"
                        kubectl get pods -l app=smart-inventory -o wide
                        echo "--- Current Services & Ingress ---"
                        kubectl get svc,ingress,pvc -l app=smart-inventory
                    """
                }
            }
        }
    }

    post {
        always {
            sh "docker logout || true"
        }
        success {
            echo "CI/CD Pipeline succeeded! Build #${BUILD_NUMBER} deployed and verified."
        }
        failure {
            echo "CI/CD Pipeline failed during build #${BUILD_NUMBER}."
            sh "kubectl get events --sort-by=.metadata.creationTimestamp | tail -n 20 || true"
        }
    }
}
