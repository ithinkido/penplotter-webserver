def initialize():
    global plotter_status, current_file, start_stamp
    plotter_status = 'Idle' #possible Idle, Started_main, Identified, Not_identified Started, Initializing_error, Stopped, Printing, Finnished
    current_file = 'None'
    start_stamp = 0
