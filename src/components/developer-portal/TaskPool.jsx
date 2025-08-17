import React, { useState, useEffect } from 'react';
import { 
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td, 
  Badge, Progress, Flex, Button, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, 
  ModalBody, ModalCloseButton, ModalFooter,
  Text, Tooltip, Spinner
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';

const TaskPool = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    // Fetch tasks with milestone information
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/tasks/with-milestones');
        if (!response.ok) throw new Error('Failed to fetch tasks');
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleViewMilestones = (task) => {
    setSelectedTask(task);
    onOpen();
  };

  // Get status color for badges
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in_progress': return 'blue';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

  if (isLoading) {
    return (
      <Box p={5} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading tasks...</Text>
      </Box>
    );
  }

  return (
    <Box p={5}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Task Pool</Heading>
        <Button as={Link} to="/admin/tasks/create" colorScheme="blue">
          Create New Task
        </Button>
      </Flex>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Task</Th>
            <Th>Status</Th>
            <Th>Priority</Th>
            <Th>Assigned To</Th>
            <Th>Progress</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {tasks.map((task) => (
            <Tr key={task.id}>
              <Td>
                <Link to={`/admin/tasks/${task.id}`} style={{ fontWeight: 'bold' }}>
                  {task.title}
                </Link>
              </Td>
              <Td>
                <Badge colorScheme={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
              </Td>
              <Td>
                <Badge colorScheme={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </Td>
              <Td>
                {task.assigned_developers || 'Unassigned'}
              </Td>
              <Td>
                <Tooltip label={`${task.milestones_completed || 0} of ${task.total_milestones || 0} milestones completed`}>
                  <Flex align="center">
                    <Progress 
                      value={task.milestone_progress || 0} 
                      size="sm" 
                      width="100px" 
                      colorScheme="blue" 
                      mr={2}
                    />
                    <Text>{task.milestone_progress || 0}%</Text>
                  </Flex>
                </Tooltip>
              </Td>
              <Td>
                <Button 
                  size="sm" 
                  colorScheme="teal" 
                  onClick={() => handleViewMilestones(task)}
                  mr={2}
                >
                  Milestones
                </Button>
                <Button 
                  as={Link} 
                  to={`/admin/tasks/${task.id}`} 
                  size="sm" 
                  colorScheme="blue"
                  mr={2}
                >
                  View
                </Button>
                <Button 
                  as={Link} 
                  to={`/admin/tasks/edit/${task.id}`} 
                  size="sm" 
                  colorScheme="yellow"
                >
                  Edit
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Milestone Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedTask?.title} - Milestones
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTask ? (
              <Box>
                <Flex justify="space-between" mb={4}>
                  <Text>Overall Progress: {selectedTask.milestone_progress || 0}%</Text>
                  <Badge colorScheme={getStatusColor(selectedTask.status)}>
                    {selectedTask.status}
                  </Badge>
                </Flex>
                
                <Text mb={4}>
                  {selectedTask.milestones_completed || 0} of {selectedTask.total_milestones || 0} milestones completed
                </Text>
                
                <Button 
                  as={Link} 
                  to={`/admin/tasks/${selectedTask.id}`} 
                  colorScheme="blue" 
                  size="sm" 
                  mb={4}
                >
                  View Full Task Details
                </Button>
                
                <Text fontSize="sm" color="gray.600">
                  To see detailed milestone information and updates, please view the full task details.
                </Text>
              </Box>
            ) : (
              <Text>No milestone information available</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TaskPool; 