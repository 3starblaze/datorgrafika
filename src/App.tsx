import Init from "./pages/init";
import Task1b from "./pages/task1b";
import Task3d from "./pages/task3d";
import Task5a from "./pages/task5a";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

function App() {
    return (
        <div className="bg-white w-screen h-screen p-4">
            <Tabs defaultValue="init">
                <TabsList className="mb-4">
                    <TabsTrigger value="init">Mājas</TabsTrigger>

                    <TabsTrigger value="task_1b">Uzdevums 1b</TabsTrigger>
                    <TabsTrigger value="task_3d">Uzdevums 3d</TabsTrigger>
                    <TabsTrigger value="task_5a">Uzdevums 5a</TabsTrigger>
                </TabsList>

                <TabsContent value="init">
                    <Init />
                </TabsContent>
                <TabsContent value="task_1b">
                    <Task1b />
                </TabsContent>
                <TabsContent value="task_3d">
                    <Task3d />
                </TabsContent>
                <TabsContent value="task_5a">
                    <Task5a />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default App;
